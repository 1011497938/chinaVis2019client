import React from 'react';
import {autorun} from 'mobx';
import * as d3 from 'd3';
import stateManager from '../../dataManager/stateManager';
import net_work from '../../dataManager/netWork';
import {dataStore} from '../../dataManager/dataStore';
import { Button, Image, List } from 'semantic-ui-react'


export default class EventTable extends React.Component{
  constructor(){
    super();
    this.state={
      data: dataStore.getPoetries(),
    }
  }

  onFilterWordChange = autorun(()=>{
    const filter_word = stateManager.filter_word.get()
    let poteries = dataStore.getPoetries()
    console.log(filter_word)
    if (filter_word==='') {
      this.setState({data: poteries})
    }else{
      poteries = poteries.filter(elm=>{
        let words = []
        elm.true_words.forEach(elm=>{
          words = [...words, ...elm]
        })
        return words.includes(filter_word)
      })
      this.setState({data: poteries})
    }
  })
  componentDidUpdate(){
  }


  static get defaultProps() {
    return {
      width: 400,
      height: 1080/2,
    };
  }

  highLight(texts, filter_word){
    let temp = []
    texts.forEach((elm,index)=>{
      temp.push(<span key={index}>{elm}</span>)
      if (index!==texts.length-1) {
        temp.push(<span key={index+'l'} style={{color:'black', textDecoration:'underline'}}>{filter_word}</span>)
      }
    })
    return temp
  }
  render(){
    const {data} = this.state
    const {height, width} = this.props
    const filter_word = stateManager.filter_word.get()
    return (
      <div style={{width: width, height: height, overflowY: 'auto', padding: 10}}>
        <List celled selection verticalAlign='middle'>
          {
            data.map((element,index) => {
              let text = element.paragraphs[0]
              if (filter_word!=='') {
                text = element.paragraphs.find((elm,index)=> element.true_words[index].includes(filter_word))
                text = text.split(filter_word)
                text = this.highLight(text, filter_word)
                console.log(text)
              }
              // 还需要加上颜色的高亮
              return (
              <List.Item key={index}>
                <List.Content>
                  {/* <span style={{color: 'black'}}><div style={{width: 100}}>{element.name}</div></span> */}
                  <span>{text}</span>
                </List.Content>
              </List.Item>
              )
            })
          }

        </List>
      </div>
    )
  }
}