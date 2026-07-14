const db = require('./config/db');

async function seed() {
  await db.initializeDB();
  const data = {
    mainDescription: '可直接到店訂購(桃園市中壢區庄敬路811巷12號1樓)...',
    items: [
      { stepNumber: 1, title: '1.請加line訂購', content: 'Line id: goodcafe' },
      { stepNumber: 2, title: '2.選擇寄送方式', content: '可選擇超商店到店或宅配' },
      { stepNumber: 3, title: '3.確認訂單', content: '我們會與您確認訂單內容與金額' },
      { stepNumber: 4, title: '4.匯款後出貨', content: '請於確認後兩日內匯款' }
    ]
  };
  await db.saveOrderingGuide(data);
  console.log("Seeded successfully");
  process.exit(0);
}

seed();
