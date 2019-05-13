import { dataStore } from "./dataStore";
import { observable, computed } from "mobx";

class StateManager {
    constructor(){
        this.center_person = '苏轼'
        
    }
    center_poetry_name = observable.box('古来云海茫茫')
    setCenterPotery(potery_name){
        this.center_poetry_name.set(potery_name)
    }
    @computed get center_poetry(){
        // return {
        //     "author": "和岘",
        //     "paragraphs": [
        //         "气和玉烛，睿化著鸿明。",
        //         "缇管一阳生。",
        //         "郊盛礼燔柴毕，旋轸凤凰城。",
        //         "森罗仪卫振华缨。",
        //         "载路溢欢声。",
        //         "皇图大业超前古，垂象泰阶平。",
        //         "岁时丰衍，九土乐升平。",
        //         "睹寰海澄清。",
        //         "道高尧舜垂衣治，日月并文明。"
        //     ],
        //     "rhythmic": "导引",
        //     "pingze": [],
        //     "words": [],
        //     "sim": [],
        //     "true_words": []
        // }
        let poteries = dataStore.getPoetries()
        const center_poetry_name = this.center_poetry_name.get()
        // console.log(center_poetry_name)
        for (let index = 0; index < poteries.length; index++) {
            const potery = poteries[index];
            if (potery.name===center_poetry_name) {
                return potery
            }
        }
        return poteries[0]
    }

    filter_word = observable.box('')
    setFilterWord(word){
        this.filter_word.set(word)
    }
}

let stateManager = new StateManager()
export default stateManager