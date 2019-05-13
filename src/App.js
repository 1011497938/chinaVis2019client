import React, { Component } from 'react';
import net_work from './dataManager/netWork';
import MapAndLifeView from './component/graph_component/MapAndLifeView'
import WordCloud from './component/graph_component/WordCloud2'
import PoetryView from './component/graph_component/poetryView2';
import { Dropdown } from 'semantic-ui-react'
import '../node_modules/react-vis/dist/style.css';
import { dataStore, potery2text } from './dataManager/dataStore';
import stateManager from './dataManager/stateManager';
import PersonInfo from './component/UI_component/PersonInfo'
import PoteryTable from './component/UI_component/PoteryTable'
class App extends Component {
  constructor(){
    super();
    this.state = {
      potery_options: dataStore.getPoetries().map((elm, index)=>{
        // console.log(elm)
        return {
          key:  index,
          text: elm.rhythmic + '-' + potery2text(elm),
          value: elm.name,
        }
      })//[]
    }
  }
  componentWillUpdate() {
    
  }

  static get defaultProps() {
    return {
      width: 1920,
      height: 1080,
    };
  }

  render() {
    // console.log(dataStore.getPoetries())
    let {width, height} = this.props
    let {potery_options} = this.state
    // console.log(potery_options)
    const top_panel_height = 65
    const person_options = [
      {
        key: '苏轼',
        value: '苏轼',
        text: '苏轼'
      },
      {
        key: '辛弃疾',
        value: '辛弃疾',
        text: '辛弃疾'
      }
    ]
    const table_width = width/5, per_info_width = width/3-table_width
    // console.log(table_width)
    return (
      <div style={{position: "absolute", width: width, height: height, backgroundColor: '#f5f5f5'}}>
        <div style={{position: 'absolute', top: 0, right:-50}}>
          <button style={{width: 50, height: 20}}/>
        </div>
        <div style={{width: width, height: top_panel_height, position: 'absolute', borderBottom: '3px solid #bbb'}}>
          <div style={{width: 300, height: top_panel_height-20, position: 'absolute', left: 250, top: 5, zIndex: 31}}>
              <Dropdown
              placeholder='State'
              fluid
              onChange={(event, data)=>{
                const {value} = data
              }}
              defaultValue={stateManager.center_person}
              search
              selection
              options={person_options}/>
            </div>
          <div style={{width: 300, height: top_panel_height-20, position: 'absolute', left: 600, top: 5, zIndex: 31}}>
            <Dropdown
            placeholder='State'
            fluid
            onChange={(event, data)=>{
              const {value} = data
              stateManager.setCenterPotery(value)
            }}
            defaultValue={potery_options[0].value}
            search
            selection
            options={potery_options}/>
          </div>
        </div>
        <div style={{position: 'absolute', width: per_info_width, height: height/2-top_panel_height, top: top_panel_height, left:0, zIndex:5}}>
          <PersonInfo width={per_info_width}/>
        </div>
        <div style={{position: 'absolute', width: table_width, height: height/2-top_panel_height, top: top_panel_height, left:per_info_width, zIndex:5}}>
          <PoteryTable width={table_width} height={height/2-top_panel_height}/>
        </div>
        <div style={{position: 'absolute', width: width/3, height: height/2-top_panel_height, top: top_panel_height, left:width/3, zIndex:5}}>
          <WordCloud width={width/3} height={height/2-top_panel_height}/>
        </div>
        <div style={{position: 'absolute', width: width/3*2, height: height/2, top:height/2 ,left:0, borderTop: '3px solid #bbb',}}>
          <PoetryView/>
        </div>
        <div style={{position: 'absolute', width: width/3, height: height-top_panel_height, top: top_panel_height, right:0, borderLeft: '3px solid #bbb',}}>
          <MapAndLifeView/>
        </div>
      </div>
    );
  }
}

export default App;