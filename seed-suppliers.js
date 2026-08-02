const db = require('./config/db');

const suppliersData = [
  // 生豆商
  {
    name: '豐潤生豆',
    category: '生豆商',
    contact_person: '陳經理',
    phone: '02-25551234',
    rating: 5,
    evaluation_notes: '非洲與美洲精品豆來源穩定，出貨速度快'
  },
  {
    name: '綠石國際咖啡',
    category: '生豆商',
    contact_person: '林先生',
    phone: '02-87654321',
    rating: 4,
    evaluation_notes: '高價位特殊處理法生豆齊全'
  },
  // 包材商
  {
    name: '佳廣包裝企業',
    category: '包材商',
    contact_person: '張小姐',
    phone: '04-23334455',
    rating: 4,
    evaluation_notes: '單向排氣閥咖啡袋品質佳，滿三千免運'
  },
  {
    name: '采楓印藝',
    category: '包材商',
    contact_person: '王先生',
    phone: '02-29998877',
    rating: 5,
    evaluation_notes: '客製化耳掛外盒印刷精美，交期約 7 天'
  },
  // 設備耗材商
  {
    name: '飛鷹烘豆設備',
    category: '設備耗材商',
    contact_person: '劉工程師',
    phone: '03-3555666',
    rating: 5,
    evaluation_notes: '烘豆機維修保養迅速，零組件齊全'
  },
  {
    name: '駿翔濾紙資材',
    category: '設備耗材商',
    contact_person: '趙小姐',
    phone: '02-22223333',
    rating: 3,
    evaluation_notes: '日本進口 V60 濾紙批發，價格實惠'
  },
  // 其他
  {
    name: '潔淨水質服務',
    category: '其他',
    contact_person: '許先生',
    phone: '0912-345678',
    rating: 4,
    evaluation_notes: '淨水器濾芯定期更換與水質檢測服務'
  },
  {
    name: '順豐速運',
    category: '其他',
    contact_person: '客服中心',
    phone: '0800-088888',
    rating: 4,
    evaluation_notes: '主要豆品與包材物流合作夥伴'
  }
];

async function seedSuppliers() {
  try {
    console.log('=== 啟動資料庫連線 ===');
    await db.initializeDB();

    console.log('=== 檢查現有進貨商資料 ===');
    const existingSuppliers = await db.getSuppliers();
    
    // 如果已有資料 (且排除我們在 db.js 裡寫死的 1 筆 mock data)，就不重複寫入
    // 這裡我們直接看總筆數。
    // 注意：如果是連接 PostgreSQL，回傳的可能是 0 筆。如果是 mock 模式，可能會回傳 1 筆。
    // 我們可以用名字來檢查是否已經有這幾家
    const hasSeededData = existingSuppliers.some(s => s.name === '豐潤生豆');
    
    if (hasSeededData) {
      console.log('⚠️ [Seed] 資料庫中已存在進貨商測試資料，跳過寫入。');
    } else {
      console.log('=== 開始寫入進貨商測試資料 ===');
      for (const data of suppliersData) {
        await db.addSupplier(data);
        console.log(`✅ 已寫入：${data.category} - ${data.name}`);
      }
      console.log('🎉 所有進貨商測試資料寫入完成！');
    }
  } catch (error) {
    console.error('❌ [Seed] 執行發生錯誤：', error);
  } finally {
    process.exit(0);
  }
}

seedSuppliers();
