import React from 'react';
import * as d3 from 'd3';
import song from '../../static/song.json';
import {dataStore, arrayEqual} from '../../dataManager/dataStore'
import kmeans from 'ml-kmeans'
// import cos_dist from 'compute-cosine-distance'
import forceBundle from '../../dataManager/forceBundle'
import eucDist from 'euclidean-distance'
import { observable, autorun} from "mobx";

let selected_time_range = observable.box([0,0])
export default class MapAndLifeView extends React.Component{
    constructor(props){
        super(props)
        this.state ={

        }
        this.nian_pu = []
        this.addrs = []
        this.life_cluster = []
    }
    
    componentWillMount(){
        this.nian_pu = dataStore.getNianPuSortByTime()
        this.addrs = dataStore.getNianPuSortByPlace()

        let {nian_pu, addrs} = this
        // 人生阶段的聚类
        let cluster_num = 5
        const event2vec = event=> [event.addr.x, event.addr.y, event.year*100000]
        let cluster_data = nian_pu.map(elm=> event2vec(elm))
        const randomInt = num => Math.floor(num*Math.random())
        let centers = new Array(cluster_num).fill(0)
                        .map(elm=> randomInt(cluster_data.length))
                        .map(elm=> cluster_data[elm])
        // console.log(cluster_data)
        let life_cluster = kmeans(cluster_data, cluster_num, { initialization: centers });
        // console.log(life_cluster, '0')
        life_cluster.centroids = life_cluster.centroids.map(elm=> {
            // 找到最近的event
            let center_vec = elm.centroid
            let close_event = nian_pu[0]
            // console.log(close_event, event2vec(close_event))
            let min_dist = eucDist(center_vec, event2vec(close_event))
            nian_pu.forEach(event=>{
                let vec = event2vec(event)
                let dist = eucDist(center_vec, vec)
                if(dist<min_dist){
                    close_event = event
                    min_dist = dist
                }
            })
            elm.centroid = close_event
            return elm
        })
        this.life_cluster = life_cluster
        // console.log(life_cluster)

        // 划分人生阶段
        let clusters= []
        nian_pu.forEach((event,index)=>{
            // console.log(index)
            let former_event_cluster = life_cluster.clusters[index-1],
                event_cluster = life_cluster.clusters[index]
            let this_cluster = clusters[clusters.length-1]
            // console.log(former_event_cluster, event_cluster, clusters)
            if(former_event_cluster!==event_cluster){
                this_cluster = [event]
                clusters.push(this_cluster)
            }else{
                this_cluster.push(event)
            }
        })
        life_cluster.clusters = clusters

    }

    componentDidMount(){
        this.drawMapLine()
    }
    // 如果加缩放要刷新
    drawMapLine(){
        const {life_cluster} = this
        const {map, life_line_events, link_paths} = this.refs
        const {projection} = map,
              {x_scale, true_buttom, true_top} = life_line_events

        // console.log(map, life_line_events,life_cluster)
        // 画映射的线
        const liner  = d3.line()
        .x(d=> d[0])
        .y(d=> d[1])

        d3.select(link_paths).selectAll('.link_path').remove()
        // console.log(life_cluster.clusters.join(','))
        life_cluster.clusters.forEach(cluster=>{
            const first = cluster[0], last = cluster[cluster.length-1]
            // , last
            for (let index in [first]) {
                const event = [first, last][index]
                const {time, addr} = event
                let start_x, start_y, end_x, end_y
                [start_x, start_y] = projection([event.addr.x, event.addr.y])
                end_x = x_scale(time)
                end_y = life_line_events.props.top
                let dy = Math.abs((end_x-start_x)/3)
                dy = (start_y-dy)<=end_y?dy:0

                d3.select(link_paths).append('path')
                .attr('d', liner([
                    [start_x, start_y],
                    [end_x, start_y+dy],
                    [end_x, end_y]
                ]))
                // .attr('class', '')
                .attr("stroke",'#78787d')
                .attr("stroke-width",1)
                .attr('opacity', 0.5)
                .attr("fill","none");
            }
        })
        // console.log(life_cluster)
    }
    static get defaultProps() {
        return {
          width: 1920/3,
          height: 1080,
        };
    }

    render (){
        const {width, height} = this.props
        const {nian_pu, addrs, life_cluster} = this
        return (
        <div className='MapAndLifeView' style={{overflow: 'hidden', width: width, height: height}}>
            <svg ref='container' width={width} height={height}>
                
                <Map ref='map' width={width} height={height/2}  nian_pu={nian_pu} addrs={addrs} life_cluster={life_cluster}/>
                <LifeLineEvents  ref='life_line_events' top={height*2/3} width={width} height={height/4} nian_pu={nian_pu} addrs={addrs} life_cluster={life_cluster}/>
                <g ref='link_paths'></g>
            </svg>
        </div>
        )
    }
};

class Map extends React.Component{
    componentWillMount(){
        const {props} = this

        // 定义地图投影
        this.projection = d3.geoMercator()
                    .center([115, 32])
                    .scale(1500)
                    .translate([props.width / 2, props.height / 2]);
        // 定义地理路径生成器
        this.path = d3.geoPath()
                .projection(this.projection);
    }

    onSelectedTimeChange = autorun(()=>{
        const time_range = selected_time_range.get()
        if (time_range[0]!==0) {
            this.drawPath(time_range)
        }else{
            // 删除轨迹
        }
    })
    componentDidMount(){
        this.initMap()
        this.drawPlace()
    }
    initMap(){
        let node = this.refs.map
        // console.log(node)
        d3.select(node).selectAll("path")
        .data(song.features)
        .enter().append("path")
        .attr('stroke',d=>{
          if(d.properties.H_SUP_PROV==="Song Dynasty"||d.properties.H_SUP_PROV===null) return '#999999';
          else return '#bbbbbb';
        } )
        .attr('stroke-width', 1)
        .attr('fill', d=>{
          if(d.properties.H_SUP_PROV==="Song Dynasty"||d.properties.H_SUP_PROV===null) return '#efefef';
          else return '#ffffff';
        })
        .attr("d", this.path);

        // let pos = this.projection([112, 31]);
        // d3.select(node)
        // .append('text')
        // .text('宋')
        // .attr('x',pos[0])
        // .attr('y',pos[1])

        // d3.select(node)
        // .call(d3.zoom()
        // .on("zoom", ()=>{
        //     // console.log('zoom',  d3.event.transform)
        //     d3.select(this.refs.container).attr('transform',d3.event.transform)
        // }))
    }
    drawPath(range){
        let {nian_pu, addrs, life_cluster} = this.props
        const {projection} = this
        let node = this.refs.place

        if (range) {
            nian_pu = nian_pu.filter(elm=>  elm.time<range[1] && elm.time>range[0])
        }
        // 画轨迹
        const lineFunction = d3.line()
                            .x(d=>projection([d.addr.x, d.addr.y])[0])
                            .y(d=>projection([d.addr.x, d.addr.y])[1])

        const move_path_canvas = d3.select(node)
        move_path_canvas.selectAll('.move_path').remove()
        let path2num = {}
        nian_pu.forEach((elm, index) => {
            if(index===nian_pu.length-1){
                return
            }
            const next_addr = nian_pu[index+1].addr
            const id = elm.addr.name + next_addr.name
            path2num[id] = path2num[id] || 0
            path2num[id]++
        });
        nian_pu.forEach((elm, index) => {
            if(index===nian_pu.length-1){
                return
            }
            const next = nian_pu[index+1]
            if (elm.addr!==next.addr) {
                move_path_canvas.append('path')
                .attr('d', lineFunction([
                    elm, next
                ]))
                .attr('class', 'move_path')
                .attr("stroke",'#78787d')
                .attr("stroke-width", path2num[elm.addr.name + next.addr.name])
                .attr("fill","none")
            }
        });
    }
    drawPlace(){
        const {projection} = this
        const {nian_pu, addrs, life_cluster} = this.props

        // .filter((elm,index)=> elm!==nian_pu[index-1])
        // let addr_names = nian_pu.map(elm=> elm.addr.name + elm.year)
        // addr_names = addr_names.join('-')
        // console.log(addr_names)

        this.drawPath()
        let node = this.refs.place


        const addr2poteries = dataStore.getAddr2Poetry()
        // console.log(dataStore.getAddr2Poetry(), dataStore.getTime2Poetry())
        const lengths = Object.keys(addr2poteries).map(elm=> addr2poteries[elm].length)
        const max = Math.max(...lengths), 
              min = Math.min(...lengths)
        // console.log(max, min, lengths)
        const rscale = d3.scaleLinear().domain([min, max]).range([3,12])

        // })
        // console.log(life_cluster)
        // 画地点
        d3.select(node)
        .selectAll('circle')
        .data(addrs)
        .enter().append("circle")
        .attr('r',d=>{
            const poteries = addr2poteries[d.name]
            if(poteries){
                // console.log(poteries.length, poteries)
                return rscale(poteries.length)
            }else
                return rscale(min)
        })
        .attr('transform',d=>"translate(" + projection([
            d.x,
            d.y
            ]) + ")")
        .attr('class', d=> d.name)
        .attr('fill',(d, index)=>{
            // console.log(d, index)
            // for (let index = 0; index < life_cluster.centroids.length; index++) {
            //     const element = life_cluster.centroids[index];
            //     if(d.events.includes(element.centroid))
            //         return 'red'
            // }
            return '#a2a4bf';
        })
        .attr('stroke','#898989')
        .on('mouseover', d=> console.log(d))
    }
    render (){
        return (
        <g className='map' ref='container'>
            <g ref='map'></g>
            <g ref='place'></g>
        </g>
        )
    }
}

class LifeLineEvents extends React.Component{
    constructor(props){
        super(props)
        const {height, width, top} = this.props
        this.padding = 0
    }
    componentDidMount(){
        this.initLifeLine()
    }
    initLifeLine(){
        const {nian_pu, addrs, life_cluster, height, width, top} = this.props
        this.padding = width/8
        const {padding} = this

        const lineFunction = d3.line()
                            .x(d=>d[0])
                            .y(d=>d[1])
        d3.select(this.refs.container)
        .attr('transform', "translate(0," + top + ")")        

        // 画底下的线
        const underline_path = this.refs.underline
        d3.select(underline_path)
        .attr('d', lineFunction([[padding, height/2], [width-padding, height/2]]))
        .attr("stroke",'#78787d')
        .attr("stroke-width",2)
        .attr("fill","none");
        this.true_top = top
        this.true_buttom = top+height

        
        let times = nian_pu.map(elm=> elm.time.getTime())
        let years = nian_pu.map(elm=> elm.year)
        times = [...new Set(times)]
        let max_time = Math.max(...times), min_time = Math.min(...times)
        max_time = new Date(max_time)
        min_time = new Date(min_time)
        times = times.map(elm=> new Date(elm))

        let x_scale = d3.scaleTime()
              .domain([min_time, max_time])
              .range([padding,width-padding])
        this.x_scale = x_scale

        // 画几个阶段
        console.log(life_cluster)
        const {clusters} = life_cluster
        const {life_stages} = this.refs
        clusters.forEach((cluster,index)=>{
            const next_cluster = clusters[index+1]
            let times = cluster.map(elm=> elm.time), next_times = next_cluster && next_cluster.map(elm=> elm.time)
            const max_time = next_cluster? Math.min(...next_times) : Math.max(...times), 
                  min_time = Math.min(...times)
            d3.select(life_stages).append('rect')
            .attr('x', d=> x_scale(min_time))
            .attr('y', d=> 0)
            .attr('width', x_scale(max_time)-x_scale(min_time))
            .attr('height', height)
            .attr('fill', index%2?'#efefef':'rgb(245, 245, 245)')
            .on('mouseover', event=>{
                // console.log(event, min_time, max_time)
                selected_time_range.set([min_time, max_time])
            })
        })

        // 画线上时间和线上面的点
        const {kuang_g} = this.refs
        let max_year = max_time.getFullYear(), min_year = min_time.getFullYear()
        const year2Date = year=> {
            let date = new Date()
            date.setFullYear(year)
            return date
        }
        const show_year_num = 10
        let show_years = new Array(show_year_num).fill(0).map((elm,index)=> Math.floor(index*(max_year-min_year)/show_year_num+min_year))
        if (!show_years.includes(max_year)) {
            show_years.push(max_year)
        }
        d3.select(kuang_g).selectAll('.time_text')
        .data(show_years).enter().append("text")
        .attr('class', 'time_text')
		.attr("x", d=> x_scale(year2Date(d)))  
		.attr("y", height+20)
		.attr("font-size",20)
		.attr("font-family","simsun")
        .text(d=> d)
        .attr('text-anchor',"middle")

        d3.select(kuang_g).selectAll('.time_text')
        .data(show_years).enter().append("text")
        .attr('class', 'time_text')
		.attr("x", d=> x_scale(year2Date(d)))  
		.attr("y", height+20)
		.attr("font-size",20)
		.attr("font-family","simsun")
        .text(d=> d)
        .attr('text-anchor',"middle")

        d3.select(kuang_g)
        .selectAll('.time_circle')
        .data(show_years)
        .enter().append("circle")
        .attr('class', 'time_circle')
        .attr('cx', d=> x_scale(year2Date(d)))
        .attr('cy', height )
        .attr('r', 2)
        .attr('fill','#a2a4bf')
        .attr('stroke','#898989');


        // 画上面的点和背景事件
        const overline_path = this.refs.overline
        d3.select(overline_path)
        .attr('d', lineFunction([[padding, 0], [width-padding, 0]]))
        .attr("stroke",'#d2d2d6')
        .attr("stroke-width",10)
        .attr("fill","none");

        let big_events_years = Object.keys(dataStore.year2big_events)
        big_events_years = big_events_years.filter(year=>{
            year = parseInt(year)
            return year<= max_year && year>=min_year
        })

        d3.select(kuang_g)
        .selectAll('.big_event_circle')
        .data(big_events_years)
        .enter().append("circle")
        .attr('class', 'big_event_circle')
        .attr('cx', d=> x_scale(year2Date(d)))
        .attr('cy', 0)
        .attr('r', 2)
        .attr('fill','#a2a4bf')
        .attr('stroke','#898989');

        // 画人生起伏
        const year2score = dataStore.getYear2Score()
        const scores = Object.keys(year2score).map(key=> year2score[key])
        const max_score = Math.max(...scores), min_score = Math.min(...scores)
        const y_scale_score = d3.scaleLinear().domain([min_score, max_score]).range([height/2, 0])

        const scoreLiner  = d3.line()
        .x(d=> x_scale(year2Date(d)))
        .y(d=> y_scale_score(year2score[d]))
        .curve(d3.curveBasis)

        d3.select(this.refs.score_line)
        .attr('d', scoreLiner(Object.keys(year2score).filter(year=> parseInt(year)<=max_year && parseInt(year)>=min_year)))  //.map(elm=>parseInt(elm))
        .attr("stroke",'#78787d')
        .attr("stroke-width",2)
        .attr("fill","none");
        // .interpolate("linear");

        // 画词的数量随时间变化
        const year2poteries = dataStore.getTime2Poetry()
        let year2potery_num ={}, nums = []
        for(let year in year2poteries){
            year2potery_num[year] = year2poteries[year].length
            nums.push(year2poteries[year].length)
        }
        const max_num = Math.max(...nums), 
              min_num = Math.min(...nums),
              y_scale_num = d3.scaleLinear().domain([max_num, min_num]).range([height, height/2])
        const potery_years = Object.keys(year2poteries).filter(year=>{
            year = parseInt(year)
            return year<= max_year && year>=min_year
        })
        const normalLiner  = d3.line()
        .x(d=> x_scale(year2Date(d)))
        .y(d=> y_scale_num(year2potery_num[d]))
        .curve(d3.curveBasis)

        d3.select(this.refs.num_line)
        .attr('d', normalLiner(potery_years))
        .attr("stroke",'#78787d')
        .attr("stroke-width",2)
        .attr("fill","none");
    }
    render (){
        return (
        <g className='lifeLineEvent' ref='container'>
            <g ref='kuang_g'>
                <g ref='life_stages'></g>
                <path ref='overline' className='underline'></path>
                <path ref='score_line' className='score_line'></path>
                <g ref='dc_line'></g>
                <path ref='num_line'></path>
                <path ref='underline' className='underline'></path>
            </g>
        </g>
        )
    }
}

class DivPath extends React.Component {
    render(){
        return (
        <div/>
        )
    }
}