import React from 'react';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';

export default class PersonInfo extends React.Component{
  constructor(){
    super();
    this.person_info = {
      '苏轼': {
        '姓名': '苏轼',
        '性别': '男',
        '别名': '东坡居士',
        '籍贯': '河北',
        '生卒': '（1037年1月8日—1101年8月24日）'
      },
      '辛弃疾': {
        '姓名': '辛弃疾',
        '性别': '男',
        '别名': '稼轩',
        '籍贯': '山东东路济南府历城县',
        '生卒': '（1140年5月28日－1207年10月3日）'
      },
    }
    this.state={
      selected_person: this.person_info[stateManager.center_person]
    }
  }
  static get defaultProps() {
    return {
      width: 200,
      height: 1080/2,
    };
  }
  render(){
    const {width, height} = this.props
    let {selected_person} = this.state;
    return (
      <div style={{padding: 10,  width: width, height: height}}>
        <div >
          <div style={{fontFamily: 'HYSunWanMinCaoShu',fontSize: 40}}>
            {selected_person['姓名']}
          </div>
          {
            Object.keys(selected_person).map(key=>
              <p key={key}><span>{key}:</span><span>{selected_person[key]}</span></p>
            )
          }
        </div>
      </div>
    )
  }
}