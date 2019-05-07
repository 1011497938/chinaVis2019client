import React from 'react';
import * as d3 from 'd3';
import {dataStore, potery2text, getYun, getFourYun, biao_dian, getRandomColor} from '../../dataManager/dataStore'
import stateManager from '../../dataManager/stateManager';
import { autorun } from 'mobx';

export default class PoetryView extends React.Component{
    constructor(props){
        super(props)
        this.yuns = ['平声', '上声', '去声', '入声']
    }
    static get defaultProps() {
        return {
          width: 1920/3*2,
          height: 1080/2,
        };
    }
    
    onCenterPoteryChange = autorun(()=>{
        console.log('onCenterPoteryChange')
        const center_poetry = stateManager.center_poetry
        this.draw()
    })
    componentDidMount(){
        this.draw()
    }

    draw(){
        const {container_svg, rythme_g} = this.refs
        d3.select(rythme_g).selectAll('g').remove()
        const center_poetry = stateManager.center_poetry
        // console.log(center_poetry)
        const {paragraphs} = center_poetry
        const all_text = potery2text(center_poetry).split('')
        // console.log(potery2text(center_poetry))

        const yun_bus = all_text.map(word=>{
            let yun_bu = dataStore.word2yun[word]
            return yun_bu
        }).filter(elm=> elm)
        let yun_bu2count = {}, yun_bu2color = {}
        yun_bus.forEach(elm=>{
            yun_bu2count[elm] = yun_bu2count[elm] || 0
            yun_bu2count[elm]++
        })
        for(let elm in yun_bu2count){
            let count = yun_bu2count[elm]
            if (count>1) {
                yun_bu2color[elm] = getRandomColor()
            }
        }

        let rythem_elements = all_text.map((word, word_index)=>{
            let yun_bu = dataStore.word2yun[word]
            if (!yun_bu) {
                // console.warn(word, '没有韵部')
                return
            }
            let simp_yun_bu = dataStore.yun2simp_yun[yun_bu]
            let ping_yin = dataStore.simp_yun2pingyin[simp_yun_bu]
            let shen_diao = ping_yin.replace(/[a-z]*/ig, '')
            ping_yin = ping_yin.replace(/[0-9]/g, '')

            // console.log(yun_bu, simp_yun_bu, ping_yin,shen_diao)   
            return {
                text: word,
                shen_diao: parseInt(shen_diao),
                yun_bu: yun_bu,
                simp_yun_bu: simp_yun_bu,
                start_x: 0,
                end_x: 0
            }
        }).filter(elm=> elm)
        
        const rect_width = 20, dy = rect_width/Math.sqrt(2)+2, dx = dy, row_dy = dy*10, word_dx = dx*2
        const wordnum_per_line = 17
        const shen_diao2array = [[],[5,5], [3,5], [2,1,4], [5,1]]
        let now_x = rect_width, now_y = -row_dy + dy
        rythem_elements.forEach((rythem_elm, index)=>{
            if (index%wordnum_per_line===0) {
                now_x = rect_width
                now_y += row_dy
            }
            const {text, shen_diao, yun_bu, simp_yun_bu} = rythem_elm
            const rect_pos = shen_diao2array[shen_diao]
            // console.log(rect_pos, shen_diao, shen_diao2array)
            let this_g = d3.select(rythme_g)
                        .append('g')
                        .attr('class', shen_diao + ' rythem-rect ' + text)
                        .attr('transform',"translate(" + [now_x,now_y] + ")")
            
            rect_pos.forEach((d,index)=>{
                let rect_g = this_g.append('g')
                .attr('transform',"translate(" + [index*dx,(5-d)*dy] + ")")


                rect_g.append('rect')
                .attr('width', rect_width)
                .attr('height', rect_width)
                .attr('fill', ()=>{
                    const color = yun_bu2color[yun_bu]
                    return color || 'black' //'#c7c685'
                })
                .attr('transform', 'rotate(45)')

                now_x += dx
            })

            this_g.append('text')
            .text(d=> text)
            .attr('x', 0)
            .attr('y', now_y+dy*7)
            .attr("font-size", 15)
            .attr('text-anchor',"middle")

            now_x += word_dx
        })
    }
    render(){
        const {width, height} = this.props
        return (
        <div style={{position:'absolute', top:0, left:0, width: width, height: height, overflow: 'auto'}}>
            <div style={{position:'absolute', top: 0, left:0}}> 
                <svg ref='container_svg' width={width} height={1080}>
                    <g ref='text_g'></g>
                    <g ref='rythme_g'></g>
                </svg>
            </div>
            <div>
                <CiteNetWork/>
            </div>
        </div>
        )
    }
}

class CiteNetWork extends React.Component{
    constructor(props){
        super(props)
        this.state = {
            
        }
    }

    componentDidMount(){
        this.draw()
    }

    componentDidUpdate(){
        this.draw()
    }

    draw(){
        const center_poetry = stateManager.center_poetry
        // console.log(center_poetry,  dataStore.poteries,center_poetry.sim[0])
        let sim_poteries =center_poetry.sim[0].map(elm=> dataStore.poteries[elm.index[0]])
        sim_poteries = sim_poteries.filter(elm=> elm.author !== center_poetry.author)
        sim_poteries.forEach(potery=>{
            const author1 = potery.author, author2 = center_poetry.author

            let path = dataStore.findReltionsBetween(author1, author2)
            console.log(potery, center_poetry, path)
            path.forEach((p2,index)=>{
                if(index===0)
                    return
                let p1 = path[index-1]
                console.log(p1, dataStore.person2reltions[p1][p2], p2)
            })
        })
        // console.log(sim_poteries)
    }

    render(){
        return (
        <div>

        </div>
        )
    }
}