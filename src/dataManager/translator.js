import {IS_EN} from './dataStore2';
var dict_cn2en = {
  '主角': 'protagonist',
  '对象': 'target',
  '出生': 'bron',
  '死亡': 'dead',
  '地点': 'location',
  '数量': 'number',
  '正负向': 'sentiment',
  '人物/角色': 'person/role',
}
var dict_en2cn = {}

// isChinese(word){
//   var re=/[^/u4e00-/u9fa5]/;
//   if (re.test(word)) 
//     return false ;
//   return true ;
// }

function cn2En(word){
    return dict_cn2en[word]
}

function auto2(word){
  if (IS_EN) {
    let new_word = dict_cn2en[word]
    return new_word || word
  }else {
    let new_word = dict_en2cn[word]
    return new_word || word
  }
}

function en2cn(word){
    return word
}

export default auto2