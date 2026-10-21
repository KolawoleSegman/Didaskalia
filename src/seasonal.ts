import type { Question } from "./questions";

type Row = [prompt: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, ref: string, why: string];

const build = (prefix: string, rows: Row[]): Question[] =>
  rows.map(([prompt, choices, answer, ref, why], i) => ({ id: `${prefix}-${i + 1}`, subject: "The Word", prompt, ref, choices, answer, why }));

export const PACKS: Record<"christmas" | "easter", Question[]> = {
  christmas: build("xmas", [
    ["In which town was Jesus born?", ["Nazareth", "Jerusalem", "Bethlehem", "Capernaum"], 2, "Luke 2:4-7", "Joseph and Mary travelled to Bethlehem, the town of David, where Jesus was born."],
    ["Who announced Jesus’ birth to the shepherds?", ["The wise men", "An angel of the Lord", "King Herod", "Zechariah"], 1, "Luke 2:9-10", "An angel told the shepherds the good news of great joy for all people."],
    ["Where was baby Jesus laid after He was born?", ["In a manger", "In a palace", "In the temple", "In a boat"], 0, "Luke 2:7", "Mary laid Him in a manger, because there was no room for them in the inn."],
    ["What was the name of Mary’s relative who was the mother of John the Baptist?", ["Anna", "Martha", "Elizabeth", "Salome"], 2, "Luke 1:36", "The angel told Mary that her relative Elizabeth was also expecting a son."],
    ["Which angel appeared to Mary to announce she would bear the Son of God?", ["Michael", "Gabriel", "Raphael", "Uriel"], 1, "Luke 1:26-28", "God sent the angel Gabriel to Mary in Nazareth."],
    ["What gifts did the wise men bring?", ["Wine, oil and grain", "Silk, spices and pearls", "Gold, silver and bronze", "Gold, frankincense and myrrh"], 3, "Matthew 2:11", "They opened their treasures and gave Him gold, frankincense and myrrh."],
    ["What led the wise men to the child?", ["A star", "A cloud", "A pillar of fire", "A dove"], 0, "Matthew 2:2", "They had seen His star in the east and followed it to worship Him."],
    ["Which king tried to kill the child Jesus?", ["Herod", "Pharaoh", "Nebuchadnezzar", "Saul"], 0, "Matthew 2:16", "Herod was troubled by the news of a newborn king and ordered the killing of the infants in Bethlehem."],
    ["Where did Joseph take his family to escape Herod?", ["Babylon", "Egypt", "Rome", "Damascus"], 1, "Matthew 2:13-14", "An angel warned Joseph in a dream, and the family fled to Egypt."],
    ["What name was Joseph told to give the child, because He would save His people from their sins?", ["Moses", "David", "Jesus", "Elijah"], 2, "Matthew 1:21", "The name Jesus means the Lord saves."],
    ["What does the name Immanuel mean?", ["Prince of Peace", "Mighty God", "Son of David", "God with us"], 3, "Matthew 1:23", "Matthew explains that Immanuel means God with us."],
  ]),
  easter: build("easter", [
    ["In which garden did Jesus pray before He was arrested?", ["Eden", "Gethsemane", "Carmel", "Bethany"], 1, "Matthew 26:36", "Jesus went with His disciples to a place called Gethsemane and prayed."],
    ["Which disciple betrayed Jesus for thirty pieces of silver?", ["Thomas", "Peter", "Judas Iscariot", "Philip"], 2, "Matthew 26:14-15", "Judas agreed with the chief priests to hand Jesus over for thirty pieces of silver."],
    ["Which disciple denied knowing Jesus three times?", ["Peter", "Andrew", "John", "Matthew"], 0, "Luke 22:61", "Peter denied Jesus three times, then wept when the rooster crowed."],
    ["Who was the Roman governor who sentenced Jesus to be crucified?", ["Herod Antipas", "Caesar Augustus", "Pontius Pilate", "Felix"], 2, "Matthew 27:26", "Pontius Pilate handed Jesus over to be crucified."],
    ["Who was released instead of Jesus?", ["Barabbas", "Dismas", "Annas", "Lazarus"], 0, "Matthew 27:26", "Pilate released the prisoner Barabbas to the crowd."],
    ["Who was made to carry Jesus’ cross?", ["Joseph of Arimathea", "Simon of Cyrene", "Nicodemus", "John"], 1, "Matthew 27:32", "The soldiers made Simon of Cyrene carry His cross."],
    ["What did Jesus promise the repentant criminal beside Him?", ["You will be remembered", "Your sins are forgotten", "You will see the temple", "Today you will be with me in paradise"], 3, "Luke 23:43", "Jesus told him, today you will be with me in paradise."],
    ["What happened to the temple curtain when Jesus died?", ["It was torn in two", "It caught fire", "It turned white", "It was taken down"], 0, "Matthew 27:51", "The curtain of the temple was torn in two from top to bottom."],
    ["Who gave his own tomb for Jesus’ burial?", ["Nicodemus", "Joseph of Arimathea", "Caiaphas", "Zacchaeus"], 1, "Matthew 27:57-60", "Joseph of Arimathea laid the body of Jesus in his own new tomb."],
    ["On which day of the week was Jesus’ tomb found empty?", ["Friday", "Saturday", "Thursday", "Sunday"], 3, "Luke 24:1", "On the first day of the week, the women found the stone rolled away."],
    ["Who was the first person to see the risen Jesus?", ["Mary Magdalene", "Peter", "Thomas", "John"], 0, "John 20:14-16", "Jesus appeared to Mary Magdalene at the tomb and spoke her name."],
  ]),
};
