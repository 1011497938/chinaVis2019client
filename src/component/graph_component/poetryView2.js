import React from 'react';
import * as d3 from 'd3';
import {dataStore, potery2text, getYun, getFourYun, biao_dian, getRandomColor, ribbonPathString} from '../../dataManager/dataStore'
import stateManager from '../../dataManager/stateManager';
import { autorun } from 'mobx';
import { euclidean } from 'ml-distance-euclidean';
import cos_dist from 'compute-cosine-distance'

export default class PoetryView extends React.Component{
    constructor(props){
        super(props)
        this.yuns = ['平声', '上声', '去声', '入声']
        this.selected_par_index = 0

        this.emotion2vec = {
            '喜': dataStore.getWord2vec('喜'),
            '怒': dataStore.getWord2vec('怒'),
            '哀': dataStore.getWord2vec('哀'),
            '乐': dataStore.getWord2vec('乐'),
            '思': dataStore.getWord2vec('思'),
        }
        this.emotion2color = {
            '喜': '#ec5737',
            '怒': '#5d513b',
            '哀': '#163471',
            '乐': '#f0c239',
            '思': '#339999', 
        }
    }

    getWord2color(word){
        let close_emotion = '喜', min_dist = 99
        let {emotion2color, emotion2vec} = this
        const this_vec = dataStore.getWord2vec(word)
        for(let emotion in emotion2vec){
            let dist = cos_dist(this_vec, emotion2vec[emotion])
            // console.log(emotion, word, dist, this_vec)
            if(min_dist>dist){
                min_dist = dist
                close_emotion = emotion
            }
        }
        if (min_dist>1) {
            return 'none'
        }
        // console.log(word, close_emotion, min_dist)
        // if(max_sim)
        return emotion2color[close_emotion]
    }
    static get defaultProps() {
        return {
          width: 1920/3*2,
          height: 1080/2,
        };
    }
    
    onCenterPoteryChange = autorun(()=>{
        // console.log('onCenterPoteryChange')
        const center_poetry = stateManager.center_poetry
        this.draw()
        this.drawRelatedPotery()
        this.drawRelations()
    })

    componentDidMount(){
        this.draw()
        this.drawRelatedPotery()
        this.drawRelations()
    }

    drawRelatedPotery(){
        const center_poetry = stateManager.center_poetry
        const {selected_par_index, paragraphs2x, paragraphs2y} = this
        const selected_par = center_poetry.paragraphs[selected_par_index] 
        const {related_g} = this.refs
        const {width, height} = this.props
        if(!selected_par){
            console.warn(selected_par, '没有指向的行')
            return
        }

        d3.select(related_g).selectAll('g').remove()
        let draw_canvas = d3.select(related_g).append('g')
        .attr('transform',"translate(" + [0,paragraphs2y[selected_par_index]] + ")")

        let sims = center_poetry.sim[selected_par_index]
        let sim_poteries = sims.map(elm=> dataStore.poteries[elm.index[0]])
        // sim_poteries = sim_poteries.filter(elm=> elm !== center_poetry )
        let potery2y = [],sim_potery_x = width/2, 
              last_x = paragraphs2x[selected_par_index][paragraphs2x[selected_par_index].length-1]
        this.sim_potery_x = sim_potery_x
        let now_y = 0
        sim_poteries.forEach((potery, p_index)=>{
            if(potery===center_poetry)
                return
            const author2 = potery.author, author1 = center_poetry.author
            // console.log(potery.paragraphs, sims)
            const sim_sentence = potery.paragraphs[sims[p_index].index[1]]

            // console.log(sims, sim_sentence)
            draw_canvas.append('g').selectAll('text')
            .data([potery.author + '-' + potery.rhythmic + ':', sim_sentence]).enter()
            .append('text')
            .text((d,i)=> d)
            .attr('x', sim_potery_x)
            .attr('y', (d,i)=> now_y + i*30)
            .attr("font-size", 16)
            .attr('text-anchor',"start")
            .on('click', (value, event)=>{
                this.selected_sim_potery = potery
                this.drawRelations()
            })
            .style('cursor', 'pointer' )

            // 画连线
            draw_canvas.append('path')
            .attr('d', ribbonPathString(last_x, 0, 10, sim_potery_x-10, now_y, 10, 0.5))
            .attr("stroke",'#78787d')
            .attr("stroke-width",2)
            .attr('fill', 'none')

            potery2y.push(now_y)
            now_y += 80 //30 * potery.paragraphs.length + 80
        })
        // console.log(sim_poteries)
    }

    // 画引用和社会关系的叠加
    drawRelations(){
        const center_poetry = stateManager.center_poetry
        const {selected_par_index, paragraphs2x, paragraphs2y, sim_potery_x, selected_sim_potery} = this
        const selected_par = center_poetry.paragraphs[selected_par_index] 
        const {related_g, relation_g} = this.refs
        const {width, height} = this.props

        if(!selected_sim_potery){
            console.warn('没有selected_sim_potery')
            return
        }
        
        const center_p = center_poetry.author, other_p = selected_sim_potery.author
        let related_p = dataStore.myDijkstra(center_p, other_p)  //共同的交集
        const net_work1 = dataStore.person2dijkstra_graph[center_p] || dataStore.constructDijGraph(center_p),
              net_work2 = dataStore.person2dijkstra_graph[other_p] || dataStore.constructDijGraph(other_p)

        d3.select(relation_g).selectAll('g').remove()
        if (related_p.length==0) {
            console.warn(center_p, other_p,'没有关系')
            return
        }
        related_p.push(center_p)
        related_p.push(other_p)
        related_p = [...new Set(related_p)]
        // console.log(selected_sim_potery, related_p)
        if (related_p.length>15) {
            const n1 = dataStore.person2dijkstra_graph[center_p],
            n2 = dataStore.person2dijkstra_graph[other_p]
            related_p = related_p.sort((a,b)=> {
                return (n1[a]+n2[a]) - (n1[b]+n2[b])
            })
            console.warn('没得办法删了一些', other_p, center_p)
            related_p = related_p.slice(0, 15)
        }
        // console.log(related_p)


        // 整成四类
        const start_x = sim_potery_x + 270
        const container_g = d3.select(relation_g).append('g')
        .attr('transform',"translate(" + [start_x, paragraphs2y[selected_par_index]] + ")")

        const p2index = {}
        const nodes = related_p.map((elm,index)=>{
            p2index[elm] = index
            let node = {
                name: elm
            }
            return node
        })
        const edges = []
        related_p.forEach(p1=>{
            // const ps = [other_p,  center_p]
            // ps.forEach(p2=>{
            //     const rel = dataStore.person2reltions[p1][p2]
            //     if (rel) {
            //         edges.push({
            //             source: p2index[p1],
            //             target: p2index[p2],
            //             type: rel,
            //         })
            //     }
            // })
            related_p.forEach(p2=>{
                const rel = dataStore.person2reltions[p1][p2]
                if (rel) {
                    console.log(p1, rel, p2)
                    edges.push({
                        source: p2index[p1],
                        target: p2index[p2],
                        type: rel,
                    })
                }
            })
        })

        const graph_width = width-start_x-40, graph_height = graph_width
        const force = d3.forceSimulation(nodes)
        .force("charge", d3.forceManyBody())
        .force("link", d3.forceLink(edges))
        .force("center",d3.forceCenter())
        let xs = nodes.map(elm=> elm.x), ys = nodes.map(elm=> elm.y)
        const max_x = Math.max(...xs), max_y = Math.max(...ys),
              min_x = Math.min(...xs), min_y = Math.min(...ys)
        nodes.forEach(node=>{
            const {name} = node
            if(name===center_p){
                node.x = min_x
                node.y = (max_y+min_y)/2
            }else if(name===other_p){
                node.x = max_x
                node.y = (max_y+min_y)/2
            }
        })
        force.restart()
        const xScale = d3.scaleLinear().domain([min_x, max_x]).range([0, graph_width]),
              yScale = d3.scaleLinear().domain([min_y, max_y]).range([60, graph_height+60])
        // console.log(max_x, max_y)

        // console.log('edges',edges, nodes)
        // edges.forEach(elm=>{
        //     if (elm.source.name) {
                
        //     }
        // })
        const normalLiner  = d3.line()
        .x(d=> xScale(d.x))
        .y(d=> yScale(d.y))

        const is_main = d =>{
            const {source, target} = d
            const names = [source, target].map(elm=> elm.name)
            return names.includes(center_p) || names.includes(other_p)
        }
        container_g
        .selectAll("path")
        .data(edges)
        .enter()
        .append("path")
        .attr('d', d=>{
            // console.log(d.source.name, d.target.name)
            return normalLiner([
                d.source,
                d.target
            ])
        })
        .attr('class', d=> d.source.name+d.target.name)
        .style("stroke", d=>{
            // return '#ccc'
            return is_main(d)? "#ccc" : 'none'
        })
        .style("stroke-width", 1)
        .attr('class', d => {
            const {source, target} = d
            return  !is_main(d)?(source.name + ' ' + target.name + ' hiden_relation_path'):''
        })

        container_g
        .selectAll("circle")
        .data(nodes)
        .enter()
        .append("circle")
        .attr('r', d=>{
            const {name} = d
            // if(name===center_p){
            //     return 5
            // }
            const poteries = dataStore.getPoetries()
            let count = 0
            // console.log(poteries)
            poteries.forEach(potery=>{
                const {sim} = potery
                sim.forEach(par=>{
                    par.forEach(elm=>{
                        const index = elm.index[0]
                        const sim_potery = dataStore.poteries[index]
                        if (sim_potery.author===name && potery!==sim_potery) {
                            count++
                        }
                    })
                })
            })
            // console.log(count)
            return Math.log(count>2?count:2)*3
        })
        .attr('fill', '#9ea0b9')
        .attr('cx', d=> xScale(d.x))
        .attr('cy', d=> yScale(d.y))
        .on('mouseover', (value, event)=>{
            // console.log(value)
            let paths = container_g.selectAll('.'+value.name)
            // console.log(paths)
            container_g.selectAll('.hiden_relation_path').style('stroke', 'none')
            paths.style('stroke', '#ccc')
        })

        container_g
        .selectAll("text")
        .data(nodes)
        .enter()
        .append("text")
        .text(d=> d.name)
        .attr('fill', 'black')
        .attr('x', d=> xScale(d.x))
        .attr('y', d=> yScale(d.y)-20)
        .attr('text-anchor', 'middle')

    }
    draw(){
        const {container_svg, container_g} = this.refs
        d3.select(container_g).selectAll('g').remove()
        const center_poetry = stateManager.center_poetry
        const {paragraphs, words, true_words} = center_poetry
        const all_text = potery2text(center_poetry).split('')
        const normal_liner  = d3.line()
        .x(d=> d[0])
        .y(d=> d[1])

        const tra_width = 13, 
              dy = tra_width*Math.sqrt(3)/2, 
              dx = tra_width*2, 
              row_dy = dy*10, 
              word_dx = dx/2
        const shen_diao2array = [[],[4,4], [2,4], [1,0,3], [4,0]]
        const paragraphs2x = [], paragraphs2y = []
        paragraphs.forEach((paragraph,index)=>{
            const paragraph2x = []

            let now_x = dx
            const now_y = dy*2 + index * row_dy
            paragraphs2y.push(now_y)

            let this_par_g = d3.select(container_g).append('g')
            .on('click', ()=>{
                console.log(index, paragraph)
                this.selected_par_index = index
                this.drawRelatedPotery()
            })
            let text_g = this_par_g
            .append('g')
            .attr('class',  'text_g')
            .attr('transform',"translate(" + [0,now_y] + ")")

            let ryth_g = this_par_g
            .append('g')
            .attr('class',  'ryth_g')
            .attr('transform',"translate(" + [0,now_y] + ")")

            true_words[index].forEach(word=>{
                const tra_color = this.getWord2color(word)
                word.split('').forEach(char=>{
                    text_g.append('text')
                    .text(char)
                    .attr('x', now_x)
                    .attr('y', 0)
                    .attr("font-size", 16)
                    .attr('text-anchor',"middle")
                    .style('cursor', 'pointer' )
                    paragraph2x.push(now_x)

                    const yun_bu = dataStore.word2yun[char]
                    if (!yun_bu) {
                        // console.warn(char, '没有韵部')
                        return
                    }
                    let simp_yun_bu = dataStore.yun2simp_yun[yun_bu],
                          ping_yin = dataStore.simp_yun2pingyin[simp_yun_bu],
                          shen_diao = ping_yin.replace(/[a-z]*/ig, '')
                    ping_yin = ping_yin.replace(/[0-9]/g, '')
                    shen_diao = parseInt(shen_diao)
                    
                    let array = shen_diao2array[shen_diao]
                    array.forEach((tra_y, index)=>{
                        tra_y = 4-tra_y
                        const center_x = now_x-tra_width/(array.length===3?2:4) +index*tra_width/2, 
                        center_y = tra_y*dy + dy*2

                        // 画连线
                        if(index!==array.length-1){
                            const next_center_x = now_x-tra_width/(array.length===3?2:4) +(index+1)*tra_width/2,
                            next_center_y = (4-array[index+1])*dy + dy*2
                            ryth_g.append('path')
                            // .attr('class', 'lalals')
                            .attr('d', normal_liner([
                                [center_x, center_y],
                                [next_center_x, next_center_y]
                            ]))
                            .attr("stroke",  tra_color!=='none'?tra_color:'#78787d')
                            .attr("stroke-width",1)
                            .attr("fill","none");
                        }

                        ryth_g.append('circle')
                        .attr('r', 2)
                        .attr('fill', '#f5f5f5')
                        .attr('cx', center_x)
                        .attr('cy', center_y)
                        .attr('stroke', tra_color!=='none'?tra_color:'#78787d')
                        .attr('stroke-width', 1)

                        // 不画三角形啦
                        // let tra_points = [
                        //     [-tra_width/2, 0],
                        //     [tra_width/2, 0],
                        //     [0, -tra_width/2*Math.sqrt(3)],
                        // ];
                        // tra_points.forEach(elm=>{
                        //     elm[0] += center_x
                        //     elm[1] += center_y
                        // })
                        
                        // let points_text =  tra_points.map(elm=> elm.join(',')).join(' ')
                        // ryth_g.append('polygon')
                        // .attr('points', points_text)
                        // .attr('fill', tra_color)
                        // .attr('stroke', tra_color!=='none'?tra_color:'black')
                    })
                    now_x += dx                    
                })
                now_x += word_dx
            })
            paragraphs2x.push(paragraph2x)
        })
        this.paragraphs2x = paragraphs2x
        this.paragraphs2y = paragraphs2y

        // 连接押韵的
        paragraphs.forEach((paragraph, p_index)=>{
            const now_y = paragraphs2y[p_index]
            let yayun_g = d3.select(container_g)
            .append('g')
            .attr('class',  'yayun_g')
            .attr('transform',"translate(" + [0,now_y] + ")")

            let chars = paragraph.split('')
            let links_num = 0
            const y = 6*dy/2*Math.sqrt(3) + dy + 2
            const line_dy = (row_dy - y)/8
            const yun_bu2y = {}
            const hanling_zhengyun = dataStore.hanling_zhengyun
            chars.forEach((char, c_index)=>{
                // 这一行
                for (let index = c_index+1; index < chars.length; index++) {
                    const elm = chars[index];
                    const yun_bu1 = hanling_zhengyun[char],
                          yun_bu2 = hanling_zhengyun[elm]
                    if(yun_bu1===yun_bu2 && yun_bu1 && (index-c_index)<5){
                        console.log(char, yun_bu1, elm, yun_bu2)
                        const x1 = paragraphs2x[p_index][c_index],
                              x2 = paragraphs2x[p_index][index]
                        let cross_line_y = yun_bu2y[yun_bu1]?yun_bu2y[yun_bu1]:y + line_dy *++links_num
                        yun_bu2y[yun_bu1] = cross_line_y

                        const liner  = d3.line()
                        .x(d=> d[0])
                        .y(d=> d[1])
                        yayun_g.append('path')
                        .attr('d', liner([
                            [x1, y],
                            [x1, cross_line_y],
                            [x2, cross_line_y],
                            [x2, y]
                        ]))
                        // .attr('class', 'yayun_line　' +elm+char)
                        .attr("stroke",'#78787d')
                        .attr("stroke-width",2)
                        .attr("fill","none");
                        break
                    }
                }

                // 和下一行
                // const next_paragraph = paragraphs[p_index+1]
                // if (!next_paragraph) {
                //     return
                // }
                // const next_char = next_paragraph.split('')
                // for (let index = c_index+1; index < next_char.length; index++) {
                //     const elm = next_char[index];
                //     const yun_bu1 = hanling_zhengyun[char],
                //           yun_bu2 = hanling_zhengyun[elm]
                //     if(yun_bu1===yun_bu2 && yun_bu1){
                //         const x1 = paragraphs2x[p_index][c_index],
                //               x2 = paragraphs2x[p_index+1][index]
                //         let cross_line_y = yun_bu2y[yun_bu1]?yun_bu2y[yun_bu1]:y + line_dy *++links_num
                //         yun_bu2y[yun_bu1] = cross_line_y


                //         yayun_g.append('path')
                //         .attr('d', normal_liner([
                //             [x1, y],
                //             [x1, cross_line_y],
                //             [x2, cross_line_y],
                //             [x2, row_dy-20]
                //         ]))
                //         .attr('class', 'yayun_line　' +elm+char)
                //         .attr("stroke",'#78787d')
                //         .attr("stroke-width",2)
                //         .attr("fill","none");
                //         break
                //     }
                // }
            })
        })
    }
    render(){
        const {width, height} = this.props
        return (
        <div style={{position:'absolute', top:0, left:0, width: width, height: height, overflow: 'auto'}}>
            <div style={{position:'absolute', top: 0, left:0}}> 
                <svg ref='container_svg' width={width} height={2080}>
                    <g ref='container_g'></g>
                    <g ref='related_g'></g>
                    <g ref='relation_g'></g>
                </svg>
            </div>
            <div>
                {/* <CiteNetWork/> */}
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

    }

    render(){
        return (
        <div>

        </div>
        )
    }
}