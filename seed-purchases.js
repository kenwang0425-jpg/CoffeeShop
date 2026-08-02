const db = require('./config/db');

async function seedPurchases() {
  console.log('🌱 開始寫入進貨單測試資料...');
  await db.initializeDB();

  // 確認是否有廠商
  const suppliers = await db.getSuppliers();
  const fengRun = suppliers.find(s => s.name === '豐潤生豆');
  const jiaGuang = suppliers.find(s => s.name === '佳廣包裝企業');

  if (!fengRun || !jiaGuang) {
    console.error('❌ 找不到「豐潤生豆」或「佳廣包裝企業」，請先執行 node seed-suppliers.js 建立廠商測試資料。');
    process.exit(1);
  }

  // 建立第一筆：生豆進貨
  try {
    const p1 = {
      supplier_id: fengRun.id,
      supplier_name: fengRun.name,
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      note: '高品質產季新豆',
      total_amount: 20 * 450,
      items: [
        {
          item_type: '生豆',
          item_name: '耶加雪菲 歌迪貝',
          batch_no: 'C192',
          origin: '衣索比亞',
          process_method: '日曬',
          quantity: 20,
          unit: 'kg',
          unit_price: 450,
          subtotal: 20 * 450
        }
      ]
    };
    const id1 = await db.createPurchase(p1);
    console.log(`✅ 成功建立生豆進貨單: ${id1}`);
  } catch(err) {
    console.error('❌ 建立生豆進貨單失敗:', err);
  }

  // 建立第二筆：包材進貨
  try {
    const p2 = {
      supplier_id: jiaGuang.id,
      supplier_name: jiaGuang.name,
      purchase_date: new Date().toISOString().split('T')[0],
      status: 'completed',
      note: '常規包材補貨',
      total_amount: (500 * 8) + (200 * 12),
      items: [
        {
          item_type: '包材',
          item_name: '半磅咖啡袋',
          batch_no: '',
          origin: '',
          process_method: '',
          quantity: 500,
          unit: '個',
          unit_price: 8,
          subtotal: 500 * 8
        },
        {
          item_type: '包材',
          item_name: '耳掛外盒',
          batch_no: '',
          origin: '',
          process_method: '',
          quantity: 200,
          unit: '個',
          unit_price: 12,
          subtotal: 200 * 12
        }
      ]
    };
    const id2 = await db.createPurchase(p2);
    console.log(`✅ 成功建立包材進貨單: ${id2}`);
  } catch(err) {
    console.error('❌ 建立包材進貨單失敗:', err);
  }

  console.log('🎉 進貨單測試資料寫入完成！');
  process.exit(0);
}

seedPurchases();
