import React from 'react';
import {autorun} from 'mobx';
import stateManager from '../../dataManager/stateManager';

export default class PersonInfo extends React.Component{
  constructor(){
    super();
    this.state={
      selected_person: {
        '姓名': '苏轼',
        '性别': '男',
        '别名': '东坡居士',
        '籍贯': '河北',
        '生卒': '（1037年1月8日—1101年8月24日）'
      }
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