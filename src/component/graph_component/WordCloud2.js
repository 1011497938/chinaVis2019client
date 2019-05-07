import React from 'react';
import * as d3 from 'd3';
import {dataStore, getFourYun, dictCopy, normalizeVec} from '../../dataManager/dataStore'
import D3WordCloud  from 'react-d3-cloud';
import Js2WordCloud from 'js2wordcloud';
import stateManager from '../../dataManager/stateManager';
import tsnejs from '../../dataManager/tsne'
import { euclidean } from 'ml-distance-euclidean';
import { Dropdown, Container } from 'semantic-ui-react';

export default class WordCloud extends React.Component{
    constructor(props){
        super(props)
        this.state={
            data1 : [],
            data2 : []            
        }

        this.data_elm1 = []  //诗词的过滤器
        this.data_elm2 = []
        this.state = {
            dropdown_options : []
        }
    }

    componentWillMount(){
        let year2poetry = dataStore.getTime2Poetry()
        let addr2potery = dataStore.getAddr2Poetry()
        let years = Object.keys(year2poetry), addrs = Object.keys(addr2potery)
        let options = [
            ...years.map(elm=>{
                return {
                    key: elm,
                    text: elm,
                    value: elm
                }
            }),
            ...addrs.map(elm=>{
                return {
                    key: elm,
                    text: elm,
                    value: elm
                }
            }),
        ]
        this.addrs = addrs
        this.years = years
        this.setState({dropdown_options: options})

        this.draw()
    }

    draw(){
        let year2poetry = dataStore.getTime2Poetry()
        let addr2potery = dataStore.getAddr2Poetry()
        const {years, addrs} = this
        const poterFilter = data_elm =>{
            let years_elm = data_elm.filter(elm=> years.includes(elm))
            let addrs_elm = data_elm.filter(elm=> addrs.includes(elm))
            let poetreis = []
            years_elm.forEach(elm=> poetreis = [...poetreis, ...year2poetry[elm]])
            addrs_elm.forEach(elm=> poetreis = [...poetreis, ...addr2potery[elm]])

            return [...new Set(poetreis)]
        }

        let p1 = poterFilter(this.data_elm1), p2 = poterFilter(this.data_elm2)


        if(!p1[0] && !p2[0]){
            let years= Object.keys(year2poetry).map(elm=> parseInt(elm))
            let center_year = (Math.max(...years)+Math.min(...years))/2
            p1 = []
            p2 = []
            for(let year in year2poetry){
                if(parseInt(year)<center_year){
                    p1 = [...p1, ...year2poetry[year]]
                }else{
                    p2 = [...p2, ...year2poetry[year]]
                }
            }    
        }
        // console.log(p1)
        const getTotalValue = data => data.reduce((total, elm)=> total+elm.value, 0)

        let data1 = dataStore.getWordCount(p1)
        data1 = data1.sort((a,b)=> b.value-a.value)
        data1 = data1.slice(0, 100)
        let total1 = getTotalValue(data1)
        data1.forEach(elm=> elm.value/=total1)

        let data2 = dataStore.getWordCount(p2)
        data2 = data2.sort((a,b)=> b.value-a.value)
        data2 = data2.slice(0, 100)  
        let total2 = getTotalValue(data2)
        data2.forEach(elm=> elm.value/=total2)

        this.setState({
            data1: data1,
            data2: data2
        })
    }

    static get defaultProps() {
        return {
          width: 1920/3*2,
          height: 1080/2,
        };
    }

    render(){
        const {width, height} = this.props
        // const {} = this
        const {dropdown_options, data1, data2} = this.state
        // console.log(data1, data2)
        return (
            <div style={{position:'absolute', top:0, left:0, width: width, height: height}}>
                <div style={{position:'absolute', top:0, left:0}}>
                    <WordCloudGenerator
                    width={width}
                    height={height}
                    data1={data1}
                    data2={data2}/>                 
                </div>
                <div style={{position:'absolute', top:0, right:10, top: 3,width: 200}}>
                    <Dropdown
                    placeholder='State'
                    fluid
                    multiple
                    onChange={(event, data)=>{
                        const {value} = data
                        this.data_elm1 = value
                        this.draw()
                    }}
                    // defaultValue={potery_options[0].value}
                    search
                    selection
                    options={dropdown_options}/>

                    <Dropdown
                    placeholder='State'
                    fluid
                    multiple
                    onChange={(event, data)=>{
                        const {value} = data
                        this.data_elm2 = value
                        this.draw()
                    }}
                    // defaultValue={potery_options[0].value}
                    search
                    selection
                    options={dropdown_options}/>

                    {/* <D3WordCloud
                        data={data2}
                        fontSizeMapper={fontSizeMapper}
                        rotate={rotate}
                        width={width/2}
                        height={height}
                    />                     */}
                    {/* <D3WordCloud
                        data={data1}
                        fontSizeMapper={fontSizeMapper}
                        rotate={rotate}
                        width={width/2}
                        height={height}
                    />    */}
                </div>
            </div>
        )
    }
}


const rangeCollisionDetect = (range1, range2) => {
    if(range1[0]>range1[1] || range2[0]>range2[1]){
        console.error(range1, range2, '什么鬼range');
    }
    return !(range1[1]<range2[0] || range2[1]<range1[0])
}

class wordElm{
    constructor(_object){
        this.text = _object.text
        this.num = _object.value
        this.text_len = this.text.split('').length 
        this.width = this.text_len * this.num // * 250 * 10 /2
        this.height = this.num //* 250 * 10 /2
        this.center_x = 0
        this.center_y = 0

        this.num1 = 0
        this.num2 = 0
        this.belong = -1

        this.vec = dataStore.getWord2vec(this.text)
    }

    getRangeX(){
        const {width, center_x} = this
        return [center_x - width/2,  center_x + width/2]
    }
    getRangeY(){
        const {height, center_y} = this
        return [center_y - height/2, center_y + height/2]
    }

    // 可以再加个bounding

    // ture撞上了
    collisionDetect(other_elm){
        // 有没有装上其他的东西
        const coll_other_text = rangeCollisionDetect(this.getRangeX(), other_elm.getRangeX()) && rangeCollisionDetect(this.getRangeY(), other_elm.getRangeY())
        // 
        return coll_other_text
    }
}

class Constrainer {
    constructor(width, height){
        this.width = width
        this.height = height

        // let points = [
        //     [0,3],[2,3],[2,6],[6,6], [6,4], [8,2], [8,-2], [6,-2], [2,-3], 
        //     [-2,-3], [-3,-4], [-3,-5], [-5,-5], [-7,-3], [-7,2], [-5,3], [-3,3], [-2,5], [-1,5], [-1,3],
        //     [0,3]
        // ]
        let points = [
            [0,3], [2,3], [2,5], [5,4], [5,3], [6,2], [8,1.5],
            [8,-1.5], [5,-2], [5,-2], 
            [-2,-3], [-2,-4.5], [-5,-5], [-7,-3], [-8,-2],
            [-8,0.5], [-6,0.5], [-6,2], [-5,2], [-5,4], [-3,4], [-3,5], [-1,5], [-1,3],
            [0,3]
        ]
        // points.forEach(elm=>{
        //     elm[1]  = 8 - elm[1]
        // })
        let xs = points.map(elm=> elm[0]), ys = points.map(elm=> elm[1])
        const center_point = d3.polygonCentroid(points) //, point_area = d3.polygonArea(now_bound)
        let max_x = Math.max(...xs), max_y = Math.max(...ys),
            min_x = Math.min(...xs), min_y = Math.min(...ys)
        // console.log(min_x, min_y, max_x, max_y)
        points = points.map(elm=>{
            return [
                elm[0] - center_point[0],
                elm[1] - center_point[1]
            ]
        })
        points = points.map(elm=>{
            return [
                elm[0]*width/(max_x-min_x),
                elm[1]*height/(max_y-min_y)
            ]
        })

        this.bound = points
        // console.log(points)
        this.area = d3.polygonArea(this.bound)
    }
    isTheArea(wordElm){
        return d3.polygonContains(this.bound, [wordElm.center_x, wordElm.center_y])
    } 
}

// 可以加个形状的约束
// 我自己写的词云
class WordCloudGenerator extends React.Component{
    constructor(props){
        super(props)
        this.state = {

        }
        const {width, height} = this.props
        const cloud_width = width/1.2, cloud_height = height/1.2  //词云的半宽和高
        this.constrainer = new Constrainer(cloud_width, cloud_height)
    }

    static get defaultProps() {
        return {
          width: 1920/2,
          height: 1080/2,
          data: [],
          data1:[],
          data2: []
        };
    }

    calTotalArea(data){
        return data.reduce((total, elm)=>{
            return total + elm.width*elm.height
        }, 0)
    }
    componentDidUpdate(){
        this.draw()
    }
    componentDidMount(){
        this.draw()
    }
    
    draw(){
        let {data1, data2, height, width} = this.props 
        const {constrainer} = this


        // 画个轮廓看看
        // const normalLiner  = d3.line()
        // .x(d=> d[0])
        // .y(d=> d[1])
        // // .curve(d3.curveBasis)
        // d3.select(this.refs.container_svg)
        // .append('path')
        // .attr('d', normalLiner(constrainer.bound.map(elm=> [elm[0]+width/2, elm[1]+height/2])))
        // .attr("stroke",'#78787d')
        // .attr("stroke-width",2)
        // .attr("fill","none");

        if(!data1[0] && !data2[0]){
            console.warn('什么都没有')
            return
        }

        data1 = data1.map(elm=> new wordElm(elm))
        data2 = data2.map(elm=> new wordElm(elm))
        let data = [], d_data1 = [], d_data2 = [], int_data = []
        data1.forEach(wordElm=>{
            let sim_in_data2 = data2.find(elm=> elm.text===wordElm.text)
            if (sim_in_data2) {
                let num1 = wordElm.num, num2 = sim_in_data2.num
                wordElm = num1>num2?wordElm:sim_in_data2
                wordElm.num1 = num1
                wordElm.num2 = num2
                wordElm.belong = 1
                int_data.push(wordElm)
            }else{
                wordElm.num1 = wordElm.num
                wordElm.belong = 0
                d_data1.push(wordElm)
            }
            data.push(wordElm)
        })
        data2.forEach(wordElm=>{
            let sim_in_data1 = data.find(elm=> elm.text===wordElm.text)
            if (!sim_in_data1) {
                wordElm.num2 = wordElm.num
                data.push(wordElm)
                wordElm.belong = 2
                d_data2.push(wordElm)
            }
        })
        // 重新布局
        // 计算每个的比例
        let now_area = data.reduce((total,elm)=>{
            return elm.width*elm.height
        }, 0)
        let true_area = constrainer.area //cloud_height*cloud_width
        let ratio = Math.sqrt(true_area/now_area)/20
        // console.log(now_area, true_area, ratio, height*width)
        // console.log(area ,ratio, now_area)
        data.forEach(elm=> {
            elm.width *= ratio
            elm.height *= ratio
        })

        let center_elm = data[0], finish_data = []
        data.forEach(elm=>{
            if (elm.num>center_elm.num) {
                center_elm = elm
            }
        })
        const {center_x, center_y} = center_elm
        data.forEach(elm=>{
            elm.center_x -= center_x
            elm.center_y -= center_y
        })
        // console.log(data.map(elm=> elm.text).join(','))
        // 指不定可以换一种方法
        // const sortByCenter = arr =>{
        //     let elm2dist = {}
        //     arr.forEach(elm=>{
        //         elm2dist[elm.text] = euclidean([elm.x, elm.y], [center_x, center_y])
        //     })
        //     return arr.sort((a,b)=> elm2dist[a.text]-elm2dist[b.text])
        // }
        const sortByNum = arr =>{
            return arr.sort((a,b)=> b.num-a.num)
        }
        data = sortByNum(data)

        const collisionDetect = text_elm =>{
            for (let index = 0; index < finish_data.length; index++) {
                const elm = finish_data[index];
                if (text_elm===elm)
                    continue
                const is_collision = text_elm.collisionDetect(elm)
                if (is_collision) {
                    return true
                }
            }
            return false
        }

        const {calTotalArea} = this
        const data_area = calTotalArea(data), 
              data1_area = calTotalArea(d_data1), 
              data2_area = calTotalArea(d_data2),
              int_area = calTotalArea(int_data)

        let start_angle = Math.PI*0.65, 
            angle_pword = Math.PI*2/data_area
            // data1_num = d_data1.length,
            // int_num = int_data.length,
            // data2_num = d_data2.length

        let data1_range = [0, angle_pword*data1_area], 
            int_range0 = [data1_range[1], data1_range[1]+angle_pword*int_area/2], 
            data2_range= [int_range0[1], int_range0[1]+angle_pword*data2_area],
            int_range1 = [data2_range[1], data2_range[1]+angle_pword*int_area/2]
        // console.log(data1_range, int_range0, data2_range, int_range1)
        // 为每个找一个最近的能放的位置
        const range2Angles = range=>{
            let angles = []
            let d_angle = Math.PI/10
            range = [range[0]-d_angle, range[1]+d_angle]
            for(let angle=range[0]; angle<range[1]; angle += Math.PI/180){
                angles.push(start_angle+angle)
            }
            return angles
        }

        data.forEach((elm,index)=>{
            let min_r = 9999, min_angle = 0
            let angles = []
            if (elm.belong===0) {
                angles = range2Angles(data1_range)
            }else if(elm.belong===1) {
                angles = [...range2Angles(int_range0), ...range2Angles(int_range1)]
            }else if(elm.belong===2) {
                angles = range2Angles(data2_range)
            }else{
                console.error(elm, 'belong有问题')
                return
            }
            angles.forEach(angle=>{
                let r = 0
                const cos = Math.cos(angle), sin = Math.sin(angle)
                while(collisionDetect(elm)){
                    // console.log(r)
                    r += height/100
                    elm.center_x = cos * r
                    elm.center_y = sin * r
                    if(r>10000){
                        console.warn(elm, '没得救了')
                        break
                    }
                }
                // console.log(r, angle, min_r, min_angle)
                if(min_r>r && constrainer.isTheArea(elm)){
                    min_r = r
                    min_angle = angle
                }
                elm.center_x = 0
                elm.center_y = 0
            })
            elm.center_x = Math.cos(min_angle) * min_r
            elm.center_y = Math.sin(min_angle) * min_r
            finish_data.push(elm)
        })

        const text_g = this.refs.text_g

        // 中间做差的
        d3.select(text_g).selectAll('.text_back_ground').remove()
        data.forEach(d =>{
            if (d.belong===1) {
                const total_num = d.num1 + d.num2,
                      width1 = d.width/total_num*d.num1,
                      width2 = d.width/total_num*d.num2


                d3.select(text_g)
                .append('rect')
                .attr('x', d.center_x - d.width/2 + width/2)
                .attr('y', d.center_y - d.height/2 + height/2)
                .attr('width', width1)
                .attr('height', d.height)
                .attr('class', 'text_back_ground')
                .attr("fill", '#588BC4')

                
                d3.select(text_g)
                .append('rect')
                .attr('x', d.center_x - d.width/2 + width/2 + width1)
                .attr('y', d.center_y - d.height/2 + height/2)
                .attr('width', width2)
                .attr('height', d.height)
                .attr('class', 'text_back_ground')
                .attr("fill", '#C1A1AA')
        
            }
        })


        d3.select(text_g).selectAll('.text_tag').remove()
        d3.select(text_g).selectAll('.text_tag')
        .data(data).enter()
        .append('text')
        .text(d=> d.text)
        .attr('x', d=> d.center_x + width/2)
        .attr('y', d=> d.center_y +  height/2)
        .attr('dy', d=>d.height/3)
        .attr("font-size",d=> d.height)
        .attr('class', 'text_tag')
        .attr('text-anchor',"middle")
        .style('fill', d=>{
            // console.log(d.belong)
            if(d.belong===0)
                return '#588BC4'
            if(d.belong===1)
                return 'white'
            if(d.belong===2)
                return '#C1A1AA'
        })
        .style('cursor', 'pointer' )
        .on('click', (d, event)=>{
            stateManager.setFilterWord(d.text)
        })
    }
    render(){
        const {width, height} = this.props
        // let {data1, data2} = this.props
        // console.log(data1, data2)
        return(
        <svg width={width} height={height} ref='container_svg'>
            <g ref='text_g'></g>
        </svg>
        )
    }
}
