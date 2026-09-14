// 20 materi Tata Bahasa (Grammar) - level: dasar / menengah / lanjut
window.grammarData = [
  {
    id:"present-simple", level:"dasar", title:"Simple Present Tense",
    rule:"Pakai simple present untuk fakta, kebiasaan, dan keadaan yang berlaku sekarang.",
    formula:"(+) S + V1 (+s/-es) | (-) S + do/does + not + V1 | (?) Do/Does + S + V1?",
    examples:["I drink coffee every morning.", "She works at a hospital.", "Water boils at 100 degrees Celsius."],
    wrong:"She work at a hospital.",
    correct:"She works at a hospital.",
    tip:"Subjek he/she/it (orang ketiga tunggal) WAJIB menambah -s atau -es pada kata kerja."
  },
  {
    id:"to-be", level:"dasar", title:"To Be: am, is, are, was, were",
    rule:"To Be dipakai sebelum kata sifat, kata benda, atau kata kerja -ing (bukan sebelum V1).",
    formula:"I am | he/she/it is | you/we/they are  ->  lampau: was / were",
    examples:["They are students.", "He is very tall.", "We were tired after the trip."],
    wrong:"She is beautiful dan She is sleeps.",
    correct:"She is beautiful. / She sleeps.",
    tip:"Jangan gabungkan to be dengan kata kerja dasar: 'is sleeps' itu salah."
  },
  {
    id:"present-continuous", level:"dasar", title:"Present Continuous (sedang terjadi)",
    rule:"Untuk aksi yang sedang berlangsung sekarang atau rencana dekat yang sudah pasti.",
    formula:"S + am/is/are + V-ing",
    examples:["I am studying English right now.", "Look! It is raining outside.", "They are meeting their boss at 10 AM."],
    wrong:"They are study English now.",
    correct:"They are studying English now.",
    tip:"Kata kunci: now, right now, at the moment, currently, Look!, Listen!"
  },
  {
    id:"past-simple", level:"dasar", title:"Simple Past Tense (lampau)",
    rule:"Untuk kejadian yang sudah selesai di waktu lampau yang spesifik.",
    formula:"(+) S + V2 | (-) S + did + not + V1 | (?) Did + S + V1?",
    examples:["I went to Bali last year.", "She did not call me yesterday.", "Did you finish the report?"],
    wrong:"I didn't went to Bali.",
    correct:"I didn't go to Bali.",
    tip:"Setelah did/didn't, kata kerja kembali ke bentuk dasar (V1). Kata kerja tak beraturan: go-went-gone."
  },
  {
    id:"past-continuous", level:"menengah", title:"Past Continuous",
    rule:"Aksi yang sedang berlangsung di momen tertentu di masa lampau, sering dipotong aksi lain.",
    formula:"S + was/were + V-ing",
    examples:["I was sleeping when you called.", "They were playing football at 4 PM yesterday.", "While she was cooking, the lights went out."],
    wrong:"I was sleep when he knocked.",
    correct:"I was sleeping when he knocked.",
    tip:"Pola umum: Past Continuous (latar) + when + Simple Past (kejadian singkat)."
  },
  {
    id:"present-perfect", level:"menengah", title:"Present Perfect Tense",
    rule:"Kejadian yang sudah terjadi tapi masih relevan sekarang, atau pengalaman hidup tanpa waktu spesifik.",
    formula:"S + have/has + V3 (past participle)",
    examples:["I have lived here for five years.", "She has already finished her homework.", "We have never eaten durian."],
    wrong:"I have live here since 2019.",
    correct:"I have lived here since 2019.",
    tip:"'for' + durasi (for 2 years), 'since' + titik mulai (since 2019). Jangan pakai waktu lampau spesifik (yesterday/last week) di tense ini."
  },
  {
    id:"future", level:"dasar", title:"Future: will vs. be going to",
    rule:"'will' untuk keputusan spontan/ramalan; 'going to' untuk rencana yang sudah dipikirkan atau bukti kuat.",
    formula:"S + will + V1  |  S + am/is/are + going to + V1",
    examples:["It's cold - I will close the window.", "We are going to visit Yogya next month (sudah booked).", "Look at those clouds! It is going to rain."],
    wrong:"I will to call you later.",
    correct:"I will call you later.",
    tip:"Setelah will, tidak pernah pakai 'to' dan tidak pakai -s/-ing."
  },
  {
    id:"articles", level:"dasar", title:"Article: a, an, the",
    rule:"'a/an' untuk benda tunggal yang masih umum; 'the' untuk benda spesifik yang sudah sama-sama diketahui.",
    formula:"a + bunyi konsonan (a book, a university) | an + bunyi vokal (an apple, an hour)",
    examples:["I bought a phone. The phone is black.", "She is an engineer.", "Please open the door."],
    wrong:"He is a honest man.",
    correct:"He is an honest man.",
    tip:"Yang menentukan adalah BUNYI, bukan huruf. 'hour' bunyinya vokal -> an. 'university' bunyinya /j/ -> a."
  },
  {
    id:"nouns", level:"dasar", title:"Countable vs Uncountable Nouns",
    rule:"Benda yang bisa dihitung pakai angka + bentuk jamak; yang tidak bisa dihitung selalu tunggal.",
    formula:"3 books / a few ideas  |  some money, much water, a little time",
    examples:["I need some advice.", "There are many chairs in the room.", "How much sugar do you want?"],
    wrong:"She gave me many advices.",
    correct:"She gave me some advice.",
    tip:"money, information, luggage, furniture, advice = uncountable (tanpa 's', pakai 'much')."
  },
  {
    id:"pronouns", level:"dasar", title:"Pronouns (Kata Ganti)",
    rule:"Subjek sebelum kata kerja, objek setelah kata kerja/preposisi.",
    formula:"I-me / you-you / he-him / she-her / we-us / they-them / it-it",
    examples:["She invited us to her party.", "This book is mine, not yours.", "Tell him the truth."],
    wrong:"Him is my brother.",
    correct:"He is my brother.",
    tip:"'his/her/their' punya (adjektif) vs 'mine/yours/theirs' punya (kata ganti berdiri sendiri)."
  },
  {
    id:"adjective-order", level:"menengah", title:"Urutan & Tingkat Kata Sifat",
    rule:"Urutan umum: ukuran -> bentuk -> umur -> warna -> asal -> bahan -> tujuan. Perbandingan: -er/more, -est/most.",
    formula:"a big old wooden table | tall -> taller -> tallest | expensive -> more -> most",
    examples:["She bought a small round Italian wooden table.", "This test is easier than the last one.", "It was the most interesting film of the year."],
    wrong:"This table is more big than that one.",
    correct:"This table is bigger than that one.",
    tip:"Kata sifat 2 suku kata berakhiran -y, -er, -ow biasanya pakai -er (happy -> happier)."
  },
  {
    id:"adverbs", level:"menengah", title:"Adverb of Frequency & Letaknya",
    rule:"Kata keterangan frekuensi diletakkan SEBELUM kata kerja utama, tapi SESUDAH to be.",
    formula:"always > usually > often > sometimes > rarely > never",
    examples:["I always brush my teeth.", "He is often late for meetings.", "They rarely eat fast food."],
    wrong:"I brush always my teeth.",
    correct:"I always brush my teeth.",
    tip:"'seldom' dan 'hardly ever' artinya hampir tidak pernah; 'never' sudah negatif, jangan tambah 'not'."
  },
  {
    id:"prep-place", level:"dasar", title:"Preposisi Tempat: in, on, at",
    rule:"'in' untuk wilayah tertutup/besar, 'on' untuk permukaan, 'at' untuk titik/lokasi spesifik.",
    formula:"in (a room, a city, a country) | on (a table, a floor, a team) | at (a door, an address, a party)",
    examples:["The keys are in my bag.", "The picture is on the wall.", "Let's meet at the train station."],
    wrong:"I am in the office desk.",
    correct:"I am at the office / The pen is on the desk.",
    tip:"'in a car' tapi 'on a bus / on a train / on a plane' (bisa jalan kaki di dalamnya)."
  },
  {
    id:"prep-time", level:"dasar", title:"Preposisi Waktu: in, on, at",
    rule:"'in' untuk rentang panjang, 'on' untuk hari/tanggal, 'at' untuk jam.",
    formula:"in July, in 2026, in the morning | on Monday, on 17 August | at 9 AM, at night",
    examples:["My birthday is on 12 March.", "We usually swim in the morning.", "The class starts at 8 o'clock."],
    wrong:"I have a meeting in Monday.",
    correct:"I have a meeting on Monday.",
    tip:"Pengecualian: 'at noon', 'at midnight', 'at the weekend' (British) / 'on the weekend' (American)."
  },
  {
    id:"modals", level:"dasar", title:"Modal Verbs: can, must, should, may",
    rule:"Modal selalu diikuti V1 murni, tanpa -s, tanpa -ing, tanpa 'to'.",
    formula:"S + modal + V1",
    examples:["You should drink more water.", "Can you help me for a second?", "Employees must wear a uniform."],
    wrong:"She can sings very well.",
    correct:"She can sing very well.",
    tip:"'have to' = wajib karena aturan luar; 'must' = wajib karena diri sendiri/aturan resmi."
  },
  {
    id:"conditionals", level:"lanjut", title:"Conditional Sentences (If-clause)",
    rule:"Tipe 0 fakta, tipe 1 kemungkinan nyata di masa depan, tipe 2 angan-angan yang tidak nyata.",
    formula:"0: If + present, present | 1: If + present, will + V1 | 2: If + past, would + V1",
    examples:["If you heat ice, it melts.", "If it rains, I will stay home.", "If I had more money, I would travel the world."],
    wrong:"If I will have time, I will call you.",
    correct:"If I have time, I will call you.",
    tip:"Di dalam klausa 'if' jangan pakai 'will'. Untuk tipe 2 sering dipakai 'If I were you...'"
  },
  {
    id:"passive", level:"menengah", title:"Passive Voice (Kalimat Pasif)",
    rule:"Fokus pada objek/hasil, bukan pelaku. Bentuknya selalu be + V3.",
    formula:"S + be (sesuai tense) + V3 (+ by pelaku)",
    examples:["The letter was sent yesterday.", "Rice is grown in Indonesia.", "This bridge has been repaired twice."],
    wrong:"The book was wrote by Pramoedya.",
    correct:"The book was written by Pramoedya.",
    tip:"Ganti 'be' sesuai tense aslinya: is done (present), was done (past), will be done (future)."
  },
  {
    id:"reported", level:"lanjut", title:"Reported Speech (Kalimat Tidak Langsung)",
    rule:"Saat mengutip ucapan orang, tense bergeser satu langkah ke masa lampau.",
    formula:"present -> past | past -> past perfect | will -> would | can -> could",
    examples:["Direct: \"I am tired.\" -> Reported: She said (that) she was tired.", "Direct: \"I finished it.\" -> Reported: He said he had finished it.", "Direct: \"Where do you live?\" -> Reported: She asked me where I lived."],
    wrong:"She said that she is busy yesterday.",
    correct:"She said that she was busy yesterday.",
    tip:"Perubahan lain: this -> that, here -> there, tomorrow -> the next day, now -> then."
  },
  {
    id:"gerund-inf", level:"lanjut", title:"Gerund vs Infinitive",
    rule:"Sebagian kata kerja butuh V-ing (gerund), sebagian butuh to + V1 (infinitive).",
    formula:"enjoy/avoid/finish + V-ing | want/decide/hope + to V1",
    examples:["I enjoy reading novels.", "She decided to move to Surabaya.", "We avoid eating fried food."],
    wrong:"I enjoy to read novels.",
    correct:"I enjoy reading novels.",
    tip:"'stop to smoke' (berhenti untuk merokok) beda dengan 'stop smoking' (berhenti merokok)."
  },
  {
    id:"conjunctions", level:"menengah", title:"Conjunctions & Linking Words",
    rule:"Kata hubung menggabungkan ide: kontras, sebab-akibat, tambahan, pilihan.",
    formula:"but / however | because / so | and / moreover | or / otherwise",
    examples:["It was raining, but we went out.", "I stayed home because I was sick.", "Study hard, otherwise you will fail."],
    wrong:"Because I was sick, so I stayed home.",
    correct:"Because I was sick, I stayed home.",
    tip:"Jangan pakai dua kata hubung sekaligus (because...so, although...but) dalam satu kalimat."
  }
];
