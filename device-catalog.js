'use strict';
(function (root) {
  const groups = [
    ['samsung','سامسونج','Samsung','جالكسي','Galaxy',['S24 Ultra','S24','S23 Ultra','S23','S22','S21','S20','S10','A55','A54','A53','A52','A35','A34','A33','A32','A25','A24','A23','A22','A15','A14','A13','A12','A11','A10','A05','A04','A03','A02','Note 20','Note 10','Z Fold5','Z Flip5']],
    ['xiaomi','شاومي','Xiaomi','شاومي','Xiaomi',['14','13','12','11','Mi 10','Mi 9']],
    ['redmi','ريدمي','Redmi','ريدمي','Redmi',['Note 13','Note 12','Note 11','Note 10','Note 9','Note 8','13C','12C','10C','9A','9C','A3']],
    ['poco','بوكو','POCO','بوكو','POCO',['F6','F5','F4','X6','X5','X3','M6','M5','M4']],
    ['oppo','أوبو','OPPO','أوبو','OPPO',['Reno11','Reno10','Reno8','A98','A78','A58','A57','A54','A16','A15']],
    ['realme','ريلمي','realme','ريلمي','realme',['12 Pro','11 Pro','10','9','C67','C55','C53','C35','C30','C21']],
    ['vivo','فيفو','vivo','فيفو','vivo',['V30','V29','V27','Y36','Y35','Y22','Y21','Y20']],
    ['huawei','هواوي','HUAWEI','هواوي','HUAWEI',['P30','P30 Lite','P20','Mate 20','Mate 10','Nova 9','Nova 7i','Y9 Prime','Y7']],
    ['honor','هونر','HONOR','هونر','HONOR',['90','70','X9b','X9a','X8b','X8','X7','X6']],
    ['motorola','موتورولا','Motorola','موتورولا','Motorola',['Edge 40','Edge 30','Moto G84','Moto G54','Moto G32','Moto G22']],
    ['infinix','إنفينيكس','Infinix','إنفينيكس','Infinix',['Note 40','Note 30','Hot 40','Hot 30','Smart 8','Smart 7']],
    ['tecno','تكنو','TECNO','تكنو','TECNO',['Camon 30','Camon 20','Spark 20','Spark 10','Pop 8']],
    ['nokia','نوكيا','Nokia','نوكيا','Nokia',['G60','G42','G22','G21','C32']],
    ['google','جوجل','Google','بيكسل','Pixel',['9','8a','8','7a','7','6a','6','5','4a']],
    ['oneplus','ون بلس','OnePlus','ون بلس','OnePlus',['12','11','10 Pro','9','Nord 3','Nord CE 3 Lite']],
    ['sony','سوني','Sony','إكسبيريا','Xperia',['1 V','10 V','5 IV','10 IV']]
  ];
  const brands = groups.map(g => ({id:g[0],ar:g[1],en:g[2]}));
  const modelCodes = {'samsung:Galaxy A54':['SM-A546'],'samsung:Galaxy A34':['SM-A346'],'samsung:Galaxy A14':['SM-A145','SM-A146'],'samsung:Galaxy S24 Ultra':['SM-S928'],'samsung:Galaxy S23 Ultra':['SM-S918']};
  const arabicSuffix = value => value.replace(/Note/g,'نوت').replace(/Ultra/g,'ألترا').replace(/Pro/g,'برو').replace(/Lite/g,'لايت').replace(/Prime/g,'برايم').replace(/Reno/g,'رينو ');
  const models = groups.flatMap(g => g[5].map(s => {
    const en=g[4]+' '+s;
    return {id:g[0]+':'+en,brand:g[0],en,ar:g[3]+' '+arabicSuffix(s),aliases:modelCodes[g[0]+':'+en] || []};
  }));
  function normalize(value) {
    let text=String(value).toLowerCase().normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/[أإآ]/g,'ا').replace(/ى/g,'ي')
      .replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-0x660)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-0x6f0));
    const replacements=[['سامسونج','samsung'],['جالكسي','galaxy'],['جلاكسي','galaxy'],['شاومي','xiaomi'],['ريدمي','redmi'],['ريلمي','realme'],['بوكو','poco'],['اوبو','oppo'],['فيفو','vivo'],['هواوي','huawei'],['هونر','honor'],['موتورولا','motorola'],['انفينيكس','infinix'],['تكنو','tecno'],['نوكيا','nokia'],['جوجل','google'],['بيكسل','pixel'],['ون بلس','oneplus'],['سوني','sony'],['اكسبيريا','xperia'],['نوت','note'],['الترا','ultra'],['برو','pro'],['لايت','lite'],['رينو','reno']];
    for(const [from,to] of replacements)text=text.split(from).join(to);
    return text.replace(/[^\p{L}\p{N}]+/gu,' ').trim();
  }
  function search(query,brand='') {
    const tokens=normalize(query).split(' ').filter(Boolean);
    return models.filter(m=>{
      if(brand && m.brand!==brand)return false;
      const b=brands.find(b=>b.id===m.brand);
      const haystack=normalize([b.ar,b.en,m.ar,m.en,...m.aliases].join(' '));
      const compact=normalize(query).replace(/ /g,'');
      const codeMatch=m.aliases.some(code=>compact.startsWith(normalize(code).replace(/ /g,'')));
      return codeMatch || tokens.every(t=>haystack.includes(t));
    });
  }
  function chooseAbi(hints) {
    if(!hints || hints.platform!=='Android')return 'universal';
    const arch=String(hints.architecture||'').toLowerCase();
    if(arch==='arm' && hints.bitness==='64')return 'arm64-v8a';
    if(arch==='arm' && hints.bitness==='32')return 'armeabi-v7a';
    if(arch==='x86' && hints.bitness==='64')return 'x86_64';
    return 'universal';
  }
  const api={brands,models,normalize,search,chooseAbi};
  if(typeof module!=='undefined' && module.exports)module.exports=api;
  else root.WeroDevices=api;
})(typeof window!=='undefined'?window:globalThis);
