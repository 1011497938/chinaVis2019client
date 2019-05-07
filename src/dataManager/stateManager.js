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