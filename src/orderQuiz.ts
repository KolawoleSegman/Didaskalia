import type { Question } from "./questions";

type Row = [first: boolean, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, ref: string, why: string];

/** "What came first / last?" questions. Each has a distinct reference, so they never collide in missed-lists. */
const ROWS: Row[] = [
  [true, ["The Tower of Babel", "The flood in Noah’s day", "God calls Abraham", "Joseph is sold into Egypt"], 1, "Genesis 6-9", "The flood came before Babel (Genesis 11), Abraham’s call (Genesis 12) and Joseph (Genesis 37)."],
  [true, ["David defeats Goliath", "Solomon dedicates the temple", "The Exodus from Egypt", "Daniel in the lions’ den"], 2, "Exodus 12-14", "The Exodus came first, long before David, Solomon and Daniel."],
  [true, ["David becomes king", "Moses receives the Ten Commandments", "Esther becomes queen", "Jerusalem falls to Babylon"], 1, "Exodus 20", "The Ten Commandments were given at Sinai, long before the other events."],
  [true, ["Jesus feeds the 5,000", "Jesus raises Lazarus", "The Last Supper", "Jesus is baptized by John"], 3, "Matthew 3:13-17", "Jesus’ baptism began His public ministry; the Last Supper came near the end."],
  [true, ["Stephen is stoned", "Paul meets Jesus on the Damascus road", "The Spirit comes at Pentecost", "Peter visits Cornelius"], 2, "Acts 2", "Pentecost (Acts 2) came before Stephen (Acts 7), Paul’s conversion (Acts 9) and Cornelius (Acts 10)."],
  [false, ["The crucifixion", "The resurrection", "The ascension", "Pentecost"], 3, "Acts 2:1-4", "Pentecost came about ten days after Jesus ascended."],
  [true, ["The Sermon on the Mount", "Jesus calls the twelve", "Jesus is baptized", "Jesus is born in Bethlehem"], 3, "Luke 2:1-7", "His birth came before His baptism, the calling of the twelve and the Sermon on the Mount."],
  [false, ["Jerusalem falls to Babylon", "Cyrus lets the exiles return", "The temple is rebuilt", "Nehemiah rebuilds the wall"], 3, "Nehemiah 6:15", "In order: the fall, Cyrus’s decree, the rebuilt temple, then Nehemiah’s wall."],
  [true, ["Jacob wrestles with God", "Joseph interprets Pharaoh’s dream", "Moses at the burning bush", "Abraham offers Isaac"], 3, "Genesis 22", "Abraham came first, then Jacob, then Joseph, then Moses."],
  [false, ["Joshua crosses the Jordan", "Samuel anoints David", "Solomon dedicates the temple", "Elijah on Mount Carmel"], 3, "1 Kings 18", "In order: the Jordan, David anointed, the temple dedicated, then Elijah on Carmel."],
  [true, ["The call of Moses at the burning bush", "The Israelites cross the Jordan", "Gideon defeats Midian", "Samuel anoints Saul"], 0, "Exodus 3:2", "Moses was called first, then Joshua led the crossing, then Gideon in the time of the judges, then Saul was anointed."],
  [false, ["David becomes king over Israel", "Samson is born", "Ruth meets Boaz", "Samuel is born"], 0, "2 Samuel 5:3", "Samson, Ruth and Samuel all belong to the time of the judges, before David became king."],
  [true, ["Daniel in the lions’ den", "Jerusalem falls to Babylon", "Esther becomes queen", "Nehemiah rebuilds the wall"], 1, "2 Kings 25:1-9", "Jerusalem fell first, then came Daniel’s lions’ den, then Esther, then Nehemiah."],
  [true, ["Jesus calms the storm", "Jesus turns water into wine", "Jesus raises Lazarus", "Jesus walks on the sea"], 1, "John 2:1-11", "The wedding at Cana was the first sign. Lazarus came near the end of His ministry."],
  [false, ["Peter denies Jesus", "Jesus prays in Gethsemane", "Jesus is crucified", "Jesus is arrested"], 2, "Luke 23:33", "Gethsemane, the arrest and Peter’s denial all came before the cross."],
  [true, ["Paul’s first missionary journey", "The council at Jerusalem", "Paul is shipwrecked on the way to Rome", "Paul meets Jesus on the Damascus road"], 3, "Acts 9:1-6", "Paul’s conversion came first, then his journeys, the council, and finally the voyage to Rome."],
  [false, ["Pentecost", "Peter’s vision of the sheet", "Stephen is martyred", "Saul is converted"], 1, "Acts 10:9-16", "Pentecost, Stephen and Saul’s conversion all came before Peter’s vision and Cornelius."],
  [true, ["Cain kills Abel", "The great flood", "Adam and Eve eat the forbidden fruit", "God calls Abram"], 2, "Genesis 3:6", "The fall came first, then Cain and Abel, the flood, and finally Abram’s call."],
];

export const ORDER_QUESTIONS: Question[] = ROWS.map(([first, choices, answer, ref, why], i) => ({
  id: `ord-${i + 1}`,
  subject: "The Word",
  prompt: first ? "Which of these happened FIRST?" : "Which of these happened LAST?",
  ref,
  choices,
  answer,
  why,
}));
