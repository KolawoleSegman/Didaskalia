import type { Question, Subject } from "./questions";

type Row = [prompt: string, ref: string, choices: [string, string, string, string], answer: 0 | 1 | 2 | 3, why: string];

const build = (prefix: string, subject: Subject, rows: Row[]): Question[] =>
  rows.map(([prompt, ref, choices, answer, why], i) => ({ id: `${prefix}-${i + 1}`, subject, prompt, ref, choices, answer, why }));

/** Bible Basics: how the Bible is put together. */
const BASICS = build("bb", "Bible Basics", [
  ["Which is the first book of the Bible?", "Genesis 1:1", ["Genesis", "Exodus", "Psalms", "Matthew"], 0, "“In the beginning God created the heaven and the earth.” Genesis opens the Bible."],
  ["Which is the last book of the Bible?", "Revelation 1:1", ["Jude", "Malachi", "Revelation", "Acts"], 2, "Revelation closes the Bible with the unveiling of Jesus Christ and the hope of His return."],
  ["How many books are in the New Testament?", "Hebrews 9:15", ["24", "27", "39", "66"], 1, "Twenty-seven books record the life of Jesus, the early church and the apostles’ letters. He is the mediator of the new covenant."],
  ["How many books are in the Old Testament (Protestant Bible)?", "Luke 24:44", ["27", "39", "46", "66"], 1, "Thirty-nine books, Genesis to Malachi: the Law, the Prophets and the Psalms, all of which speak of Christ."],
  ["Which four books tell the story of Jesus’ life and are called the Gospels?", "John 20:31", ["Matthew, Mark, Luke, John", "Genesis, Exodus, Leviticus, Numbers", "Acts, Romans, James, Jude", "Isaiah, Jeremiah, Ezekiel, Daniel"], 0, "These were written “that ye might believe that Jesus is the Christ, the Son of God.”"],
  ["Who wrote most of the New Testament letters?", "2 Peter 3:15-16", ["Peter", "Paul", "John", "James"], 1, "Paul wrote thirteen letters. Peter even speaks of “our beloved brother Paul” and his writings."],
  ["The word “gospel” means what?", "Luke 2:10", ["Good news", "Holy law", "Ancient story", "Prayer book"], 0, "The angel said, “I bring you good tidings of great joy.” The gospel is the good news of Jesus Christ."],
  ["Most of the Old Testament was first written in which language?", "Daniel 2:4", ["Greek", "Hebrew", "Latin", "Egyptian"], 1, "Mostly Hebrew, with a few passages (like Daniel 2:4 to 7:28) in Aramaic."],
  ["The New Testament was first written in which language?", "Acts 21:37", ["Hebrew", "Latin", "Greek", "Aramaic"], 2, "Greek was the common language of the Roman world. Paul was even asked, “Canst thou speak Greek?”"],
  ["Which book of the Bible has the most chapters?", "Psalm 150:6", ["Isaiah", "Genesis", "Psalms", "Jeremiah"], 2, "Psalms has 150 chapters and ends, “Let every thing that hath breath praise the LORD.”"],
  ["Which psalm is the shortest chapter in the Bible?", "Psalm 117:1", ["Psalm 23", "Psalm 117", "Psalm 100", "Psalm 150"], 1, "Psalm 117 has only two verses, calling all nations to praise the Lord."],
  ["What are the first five books of the Bible called?", "Deuteronomy 31:24", ["The Pentateuch", "The Epistles", "The Minor Prophets", "The Gospels"], 0, "Genesis to Deuteronomy, also called the Law or Torah, were written down by Moses."],
]);

/** Old Testament: the story of Israel. */
const OLD = build("ot", "Old Testament", [
  ["What did God create on the first day?", "Genesis 1:3", ["Light", "Dry land", "The sun and moon", "Animals"], 0, "“And God said, Let there be light: and there was light.”"],
  ["Whom did God form from the dust of the ground as the first man?", "Genesis 2:7", ["Adam", "Seth", "Noah", "Cain"], 0, "The Lord God formed man of the dust of the ground and breathed into him the breath of life."],
  ["What did God set in the clouds as a promise never to flood the whole earth again?", "Genesis 9:13", ["A rainbow", "A bright star", "A white dove", "A pillar of fire"], 0, "“I do set my bow in the cloud, and it shall be for a token of a covenant between me and the earth.”"],
  ["How old was Abram when he left Haran at God’s call?", "Genesis 12:4", ["50", "75", "90", "100"], 1, "“Abram was seventy and five years old when he departed out of Haran.” He went by faith."],
  ["Jacob worked seven years to marry Rachel. Whom was he first given as a wife?", "Genesis 29:25", ["Rachel", "Leah", "Bilhah", "Zilpah"], 1, "Laban gave him Leah first, so Jacob worked another seven years for Rachel."],
  ["How many plagues did God send on Egypt before Pharaoh let Israel go?", "Exodus 12:29", ["Seven", "Ten", "Twelve", "Forty"], 1, "Ten plagues, the last being the death of the firstborn, after which Israel left Egypt."],
  ["On which mountain did the Lord come down to give Israel His law?", "Exodus 19:20", ["Mount Sinai", "Mount Carmel", "Mount Nebo", "Mount Ararat"], 0, "“The LORD came down upon mount Sinai,” and called Moses up to the top."],
  ["Which city’s walls fell after the Israelites marched around it for seven days?", "Joshua 6:20", ["Jericho", "Ai", "Hebron", "Bethel"], 0, "At the shout of the people and the sound of the trumpets, the wall fell flat."],
  ["Which judge of Israel had strength tied to his uncut hair?", "Judges 16:17", ["Gideon", "Samson", "Ehud", "Jephthah"], 1, "Samson was a Nazirite from birth. His strength left him when his hair was cut."],
  ["Who was anointed by Samuel as Israel’s first king?", "1 Samuel 10:1", ["David", "Solomon", "Saul", "Jonathan"], 2, "Samuel poured oil on Saul’s head and kissed him, saying the Lord had anointed him ruler over His people."],
  ["Which king asked God for an understanding heart to lead the people?", "1 Kings 3:9", ["David", "Hezekiah", "Solomon", "Josiah"], 2, "Solomon asked for wisdom to discern between good and bad, and God was pleased with his request."],
  ["Who were thrown into the fiery furnace for refusing to bow to the golden image?", "Daniel 3:23", ["Shadrach, Meshach and Abednego", "Daniel, Ezekiel and Isaiah", "Jonah, Hosea and Amos", "Elijah, Elisha and Samuel"], 0, "The three young men trusted God, and the Lord walked with them in the fire."],
]);

/** Life of Jesus: His birth, miracles, parables, death and resurrection. */
const JESUS = build("lj", "Life of Jesus", [
  ["Which angel told Mary she would bear the Son of the Highest?", "Luke 1:31", ["Michael", "Gabriel", "Raphael", "Uriel"], 1, "Gabriel told Mary, “Thou shalt conceive in thy womb, and bring forth a son, and shalt call his name JESUS.”"],
  ["In which town did Jesus grow up?", "Luke 2:51", ["Bethlehem", "Nazareth", "Capernaum", "Jericho"], 1, "He went down with Mary and Joseph to Nazareth and was subject to them."],
  ["At the wedding in Cana, Jesus’ first miracle turned water into what?", "John 2:11", ["Wine", "Oil", "Milk", "Honey"], 0, "This beginning of miracles manifested His glory, and His disciples believed in Him."],
  ["How many apostles did Jesus choose from among His disciples?", "Luke 6:13", ["Seven", "Ten", "Twelve", "Seventy"], 2, "After a night of prayer, He called His disciples and chose twelve, whom He named apostles."],
  ["What did the disciples have to feed the five thousand?", "Matthew 14:17", ["Five loaves and two fish", "Seven loaves and a few fish", "Twelve loaves and one fish", "Three loaves and three fish"], 0, "Jesus blessed the five loaves and two fish, and there were twelve baskets left over."],
  ["Whom did Jesus raise from the tomb after he had been dead four days?", "John 11:43", ["Lazarus", "Jairus’s daughter", "The widow of Nain’s son", "Dorcas"], 0, "Jesus cried, “Lazarus, come forth,” and the dead man came out."],
  ["Who baptized Jesus in the Jordan River?", "Matthew 3:13", ["Peter", "John the Baptist", "Andrew", "Philip"], 1, "John baptized Jesus, and the Spirit descended like a dove as a voice from heaven spoke."],
  ["In the parable of the sower, what does the seed represent?", "Luke 8:11", ["The word of God", "The Holy Spirit", "The poor", "The angels"], 0, "“The seed is the word of God.” The soils show how people receive it."],
  ["In the parable of the Good Samaritan, who stopped to help the wounded man?", "Luke 10:33", ["A priest", "A Levite", "A Samaritan", "A scribe"], 2, "The Samaritan had compassion, bound his wounds and paid for his care. Jesus said, “Go, and do thou likewise.”"],
  ["In the parable of the lost son, what did the father do when he saw his son coming home?", "Luke 15:20", ["Ran, embraced and kissed him", "Sent a servant to meet him", "Waited inside the house", "Made him work as a servant"], 0, "While he was yet a great way off, his father saw him, had compassion, and ran and fell on his neck."],
  ["On which day of the week did Jesus rise from the dead?", "Mark 16:9", ["The Sabbath", "The first day of the week", "The day before Passover", "The fiftieth day"], 1, "He rose early on the first day of the week, which we now call Sunday."],
  ["To whom did Jesus first appear after He rose?", "John 20:14", ["Peter", "Mary Magdalene", "John", "Thomas"], 1, "Mary stood weeping at the tomb, and Jesus said to her, “Mary.” She was the first to see the risen Lord."],
  ["Which disciple said he would not believe until he saw the wounds in Jesus’ hands?", "John 20:27", ["Thomas", "Philip", "Bartholomew", "Thaddaeus"], 0, "Jesus invited him to touch His hands and side, and Thomas answered, “My Lord and my God.”"],
  ["Before returning to heaven, what did Jesus tell His disciples to do?", "Matthew 28:19", ["Go and make disciples of all nations", "Hide until the danger passes", "Rebuild the temple", "Stay in Galilee"], 0, "“Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost.”"],
]);

/** Early Church: Acts and the letters. */
const CHURCH = build("ec", "Early Church", [
  ["About how many people were added to the church on the day of Pentecost?", "Acts 2:41", ["120", "Three thousand", "Five thousand", "Twelve"], 1, "Those who gladly received Peter’s word were baptized, and about three thousand souls were added that day."],
  ["Who was the first Christian martyr?", "Acts 7:59", ["James", "Stephen", "Peter", "Paul"], 1, "Stephen was stoned, praying, “Lord Jesus, receive my spirit,” and asking that the sin not be held against his killers."],
  ["Saul of Tarsus came to be known by what other name?", "Acts 13:9", ["Silas", "Paul", "Barnabas", "Timothy"], 1, "“Saul, (who also is called Paul).” He became the great apostle to the Gentiles."],
  ["In which city were the disciples first called Christians?", "Acts 11:26", ["Jerusalem", "Antioch", "Rome", "Ephesus"], 1, "In Antioch, Barnabas and Saul taught a great number of people for a whole year."],
  ["Which prophet was the Ethiopian official reading when Philip met him?", "Acts 8:28", ["Jeremiah", "Isaiah", "Daniel", "Moses"], 1, "Starting from Isaiah’s words, Philip preached Jesus to him, and he was baptized."],
  ["Which Roman centurion’s household first received the Holy Spirit among the Gentiles?", "Acts 10:44", ["Cornelius", "Sergius Paulus", "Festus", "Agrippa"], 0, "While Peter spoke, the Holy Spirit fell on all who heard, and they were baptized."],
  ["Who did the Holy Spirit set apart to go out together with Saul from Antioch?", "Acts 13:2", ["Barnabas", "Silas", "Timothy", "Luke"], 0, "“Separate me Barnabas and Saul for the work whereunto I have called them.”"],
  ["In which city did Paul and Silas sing praises in prison, when an earthquake opened the doors?", "Acts 16:25", ["Corinth", "Philippi", "Athens", "Thessalonica"], 1, "At midnight, Paul and Silas prayed and sang praises to God, and the prisoners heard them."],
  ["Which of Paul’s letters contains the famous chapter on love?", "1 Corinthians 13:1", ["Romans", "1 Corinthians", "Galatians", "Philemon"], 1, "1 Corinthians 13 teaches that without love, even great gifts are nothing."],
  ["Who wrote the book of Revelation?", "Revelation 22:8", ["John", "Paul", "Peter", "Jude"], 0, "“And I John saw these things, and heard them.” John received the vision from Jesus Christ."],
  ["On which island was John when he received the Revelation?", "Revelation 1:9", ["Crete", "Cyprus", "Patmos", "Malta"], 2, "John was on the isle called Patmos for the word of God and the testimony of Jesus Christ."],
  ["Which woman in Joppa did the Lord raise from the dead through Peter’s prayer?", "Acts 9:40", ["Lydia", "Dorcas (Tabitha)", "Priscilla", "Phoebe"], 1, "Peter knelt, prayed, and said, “Tabitha, arise.” She opened her eyes and sat up."],
]);

/** Psalms and Wisdom: songs and proverbs. */
const WISDOM = build("pw", "Psalms & Wisdom", [
  ["“The LORD is my shepherd; I shall not want” begins which psalm?", "Psalm 23:1", ["Psalm 1", "Psalm 23", "Psalm 91", "Psalm 150"], 1, "David’s psalm of trust: the Lord leads, restores and stays with His people, even in the valley."],
  ["According to Psalm 1:2, the blessed person delights in what?", "Psalm 1:2", ["The law of the LORD", "The counsel of the wise", "Wealth and honor", "Victory in battle"], 0, "His delight is in the law of the Lord, and in it he meditates day and night."],
  ["Which psalm begins, “Make a joyful noise unto the LORD, all ye lands”?", "Psalm 100:1", ["Psalm 23", "Psalm 51", "Psalm 100", "Psalm 121"], 2, "Psalm 100 calls everyone to serve the Lord with gladness and enter His gates with thanksgiving."],
  ["In which psalm does David pray, “Create in me a clean heart, O God”?", "Psalm 51:10", ["Psalm 1", "Psalm 51", "Psalm 91", "Psalm 139"], 1, "David prayed this in repentance, asking God to renew a right spirit within him."],
  ["Proverbs 1:7 says the fear of the LORD is the beginning of what?", "Proverbs 1:7", ["Wealth", "Knowledge", "Victory", "Rest"], 1, "“The fear of the LORD is the beginning of knowledge: but fools despise wisdom and instruction.”"],
  ["Proverbs 15:1 says a soft answer turns away what?", "Proverbs 15:1", ["Wrath", "Pride", "Sorrow", "Doubt"], 0, "“A soft answer turneth away wrath: but grievous words stir up anger.”"],
  ["Proverbs 22:6 says that a child trained in the right way will not do what when old?", "Proverbs 22:6", ["Depart from it", "Forget his youth", "Seek riches", "Fear death"], 0, "“Train up a child in the way he should go: and when he is old, he will not depart from it.”"],
  ["Who is credited with writing most of the book of Proverbs?", "Proverbs 1:1", ["David", "Solomon", "Hezekiah", "Agur"], 1, "“The proverbs of Solomon the son of David, king of Israel.”"],
  ["Ecclesiastes 3:1 says that to every thing there is what?", "Ecclesiastes 3:1", ["A season", "An end", "A secret", "A sorrow"], 0, "“To every thing there is a season, and a time to every purpose under the heaven.”"],
  ["According to Psalm 119:9, how can a young person keep his way pure?", "Psalm 119:9", ["By taking heed to God’s word", "By great wealth", "By fasting alone", "By travelling far"], 0, "“Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word.”"],
  ["In Psalm 139:14, David praises God because he is fearfully and what made?", "Psalm 139:14", ["Wonderfully", "Mightily", "Humbly", "Newly"], 0, "“I will praise thee; for I am fearfully and wonderfully made: marvellous are thy works.”"],
  ["Psalm 91:1 says the one who dwells in the secret place of the Most High will abide under what?", "Psalm 91:1", ["The shadow of the Almighty", "The wings of morning", "The mountains of Zion", "The tent of David"], 0, "God is the refuge and fortress of those who trust Him."],
  ["In Psalm 46:10, God says, “Be still, and know that I am …” what?", "Psalm 46:10", ["God", "Faithful", "King", "Near"], 0, "“Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.”"],
]);

export const MORE_QUESTIONS: Question[] = [...BASICS, ...OLD, ...JESUS, ...CHURCH, ...WISDOM];
export const MORE_SUBJECTS = ["Bible Basics", "Old Testament", "Life of Jesus", "Early Church", "Psalms & Wisdom"] as const;
