import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Directory, Encoding, Filesystem } from "@capacitor/filesystem";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Share } from "@capacitor/share";

/** True inside the Android app, false on the website. */
export const isNative = Capacitor.isNativePlatform();

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

export async function shareText(title: string, message: string): Promise<ShareResult> {
  try {
    if (isNative) {
      await Share.share({ title, text: message, dialogTitle: "Share your result" });
      return "shared";
    }
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text: message });
      return "shared";
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "cancelled";
    /* otherwise fall through to the clipboard */
  }
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(message);
      return "copied";
    }
  } catch {
    /* clipboard blocked */
  }
  return "failed";
}

/**
 * Hands the user a .json file. A plain <a download> does nothing inside an
 * Android WebView, so in the app we write the file and open the share sheet.
 */
export async function saveJsonFile(filename: string, json: string): Promise<"saved" | "shared" | "failed"> {
  if (isNative) {
    try {
      const { uri } = await Filesystem.writeFile({
        path: filename,
        data: json,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
      });
      await Share.share({ title: filename, url: uri, dialogTitle: "Save your questions" });
      return "shared";
    } catch {
      return "failed";
    }
  }
  try {
    const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "saved";
  } catch {
    return "failed";
  }
}

/** Android hardware/gesture Back. Returns an unsubscribe function. */
export function onBackButton(handler: () => void): () => void {
  if (!isNative) return () => {};
  let removed = false;
  let remove: (() => void) | undefined;
  void App.addListener("backButton", handler).then((h) => {
    if (removed) void h.remove();
    else remove = () => void h.remove();
  });
  return () => {
    removed = true;
    remove?.();
  };
}

export function exitApp(): void {
  void App.exitApp();
}

/** Daily reminder (Android app only). Pass null to turn it off. */
export async function setReminder(hour: number | null): Promise<"on" | "off" | "denied" | "failed"> {
  if (!isNative) return "failed";
  try {
    await LocalNotifications.cancel({ notifications: [{ id: 1 }] });
    if (hour === null) return "off";
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display !== "granted") return "denied";
    await LocalNotifications.schedule({
      notifications: [{ id: 1, title: "Didaskalia", body: "Your daily round is ready. Keep your streak alive!", schedule: { on: { hour, minute: 0 }, allowWhileIdle: true } }],
    });
    return "on";
  } catch {
    return "failed";
  }
}

/** Shares a result image if possible, otherwise falls back to plain text. */
export async function shareResult(title: string, message: string, image: Blob | null): Promise<ShareResult> {
  if (!image) return shareText(title, message);
  try {
    if (isNative) {
      const data = await new Promise<string>((resolve, reject) => {
        const fr = new FileReader();
        fr.onload = () => resolve(String(fr.result).split(",")[1]);
        fr.onerror = reject;
        fr.readAsDataURL(image);
      });
      const { uri } = await Filesystem.writeFile({ path: "didaskalia-result.png", data, directory: Directory.Cache });
      await Share.share({ title, text: message, url: uri, dialogTitle: "Share your result" });
      return "shared";
    }
    const file = new File([image], "didaskalia-result.png", { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title, text: message });
      return "shared";
    }
  } catch (err) {
    if ((err as Error)?.name === "AbortError") return "cancelled";
  }
  return shareText(title, message);
}
