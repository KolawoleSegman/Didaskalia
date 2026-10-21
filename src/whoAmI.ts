import type { Question } from "./questions";

type Row = [clue: string, ref: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, why: string];

const ROWS: Row[] = [
  ["I was swallowed by a great fish after running from God’s call to Nineveh.", "Jonah 1:17", ["Elijah", "Jonah", "Hosea", "Amos"], 1, "Jonah fled from the Lord’s call, was swallowed by a great fish, and later preached in Nineveh."],
  ["I was a tax collector who climbed a sycamore tree to see Jesus.", "Luke 19:4", ["Zacchaeus", "Matthew", "Nicodemus", "Bartimaeus"], 0, "Zacchaeus climbed a tree to see Jesus, who then went to his house."],
  ["I was a queen who risked my life to plead for my people before the king.", "Esther 4:16", ["Ruth", "Deborah", "Esther", "Miriam"], 2, "Esther approached the king uninvited to save the Jewish people."],
  ["I was thrown into a den of lions, but God shut their mouths.", "Daniel 6:22", ["Joseph", "Daniel", "Shadrach", "Jeremiah"], 1, "Daniel was kept safe in the lions’ den because he trusted his God."],
  ["I was a Pharisee who met Jesus at night and heard that I must be born again.", "John 3:3", ["Gamaliel", "Caiaphas", "Nicodemus", "Joseph of Arimathea"], 2, "Nicodemus came to Jesus by night, and Jesus taught him about being born again."],
  ["I was a shepherd boy who defeated Goliath with a sling and a stone.", "1 Samuel 17:50", ["David", "Saul", "Samuel", "Jonathan"], 0, "David defeated Goliath trusting in the Lord, with a sling and a stone."],
  ["I built an ark at God’s command before the flood.", "Genesis 6:14", ["Enoch", "Abraham", "Noah", "Methuselah"], 2, "Noah obeyed God and built the ark, and his family was saved through the flood."],
  ["I persecuted the church until I met Jesus on the road to Damascus.", "Acts 9:3-5", ["Peter", "Paul", "Barnabas", "Stephen"], 1, "Saul, who became Paul, was changed by meeting the risen Jesus."],
  ["I was a fisherman who denied Jesus three times, and was later restored.", "John 21:15-17", ["Peter", "Andrew", "John", "James"], 0, "After denying Jesus, Peter was restored and told to feed His sheep."],
  ["I was sold by my brothers and later ruled in Egypt under Pharaoh.", "Genesis 41:41", ["Judah", "Reuben", "Benjamin", "Joseph"], 3, "Joseph was sold into Egypt, then raised up to rule under Pharaoh, and saved many from famine."],
  ["I was a Moabite woman who stayed with my mother-in-law and said her people would be mine.", "Ruth 1:16", ["Orpah", "Ruth", "Naomi", "Rahab"], 1, "Ruth stayed loyal to Naomi and the God of Israel."],
  ["I was a prophet who called down fire from heaven on Mount Carmel.", "1 Kings 18:38", ["Elisha", "Isaiah", "Samuel", "Elijah"], 3, "Elijah challenged the prophets of Baal, and the fire of the Lord fell."],
  ["I laughed when God promised that I, in my old age, would bear a son to Abraham.", "Genesis 18:12", ["Hagar", "Sarah", "Rebekah", "Rachel"], 1, "Sarah laughed at the promise, yet she bore Isaac at the very time God had said."],
  ["I was the first king of Israel, a head taller than all the people.", "1 Samuel 9:2", ["Saul", "David", "Samuel", "Eli"], 0, "Saul stood head and shoulders above the people, but he later disobeyed the Lord."],
  ["I walked with God, and then I was not, for God took me.", "Genesis 5:24", ["Enoch", "Methuselah", "Lamech", "Seth"], 0, "Enoch walked with God and did not see death, for God took him."],
  ["I was a prophetess and judge who led Israel to victory, sitting under a palm tree.", "Judges 4:4", ["Deborah", "Miriam", "Huldah", "Jael"], 0, "Deborah judged Israel and called Barak to lead the army against Sisera."],
  ["I was a boy serving in the house of the Lord when He called my name in the night.", "1 Samuel 3:10", ["Eli", "Samuel", "Eliab", "Gideon"], 1, "Samuel answered, “Speak; for thy servant heareth,” and became a prophet to Israel."],
  ["I was a wise king who built the temple in Jerusalem.", "1 Kings 6:14", ["Hezekiah", "Solomon", "Uzziah", "Rehoboam"], 1, "Solomon built the house of the Lord and finished it, as his father David had planned."],
  ["I met Jesus at a well, and went back to tell my whole town about Him.", "John 4:28-29", ["Martha", "The woman of Samaria", "Mary Magdalene", "Lydia"], 1, "The woman left her waterpot and said, “Come, see a man, which told me all things that ever I did.”"],
  ["I sold purple cloth in Philippi, and the Lord opened my heart to Paul’s message.", "Acts 16:14", ["Priscilla", "Lydia", "Phoebe", "Eunice"], 1, "Lydia listened, was baptized with her household, and welcomed Paul and his friends into her home."],
  ["My mother Eunice and grandmother Lois taught me the Scriptures, and Paul wrote me two letters.", "2 Timothy 1:5", ["Titus", "Timothy", "Silas", "Epaphras"], 1, "Paul remembered Timothy’s sincere faith, which first lived in his grandmother and mother."],
  ["I was a tax collector sitting at my booth when Jesus said, “Follow me,” and I wrote a Gospel.", "Matthew 9:9", ["Matthew", "Mark", "Luke", "Bartholomew"], 0, "Matthew arose and followed Jesus immediately."],
  ["I was a Roman governor who washed my hands and said I was innocent of Jesus’ blood.", "Matthew 27:24", ["Herod", "Pilate", "Felix", "Festus"], 1, "Pilate gave in to the crowd, though he knew Jesus was innocent."],
  ["I was the mother of John the Baptist, and the baby leaped in my womb when Mary greeted me.", "Luke 1:41", ["Anna", "Elisabeth", "Martha", "Salome"], 1, "Elisabeth was filled with the Holy Spirit and called Mary “the mother of my Lord.”"],
];

export const WHO_AM_I: Question[] = ROWS.map(([clue, ref, choices, answer, why], i) => ({
  id: `who-${i + 1}`,
  subject: "The Word",
  prompt: `Who am I? ${clue}`,
  ref,
  choices,
  answer,
  why,
}));
