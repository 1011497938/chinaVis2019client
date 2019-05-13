import xingqiji_nianpu from '../data/年谱信息/辛弃疾.json'
import xingqiji_nianpu_cbdb from '../data/年谱信息/辛弃疾_CBDB.json'
import sushi_nianpu from '../data/年谱信息/苏轼.json'
import sushi_nianpu_cbdb from '../data/年谱信息/苏轼_CBDB.json'

import pingshuiyun from '../data/平水韵.json'
import hanling_zhengyun from '../data/诗词数据/词林正韵.json'
import guanzhi2pingji from '../data/官职品级.json'
import trigger_imp from '../data/年谱信息/trigger_imp.json'
import stateManager from './stateManager.js'
import all_songci from '../data/诗词数据/全宋词.json'
import sushi_potery_info from '../data/诗词数据/苏轼词编年.json'
import xingqiji_potery_info from '../data/诗词数据/辛弃疾词编年.json'
import　levenshtein from　'fast-levenshtein'
import eucDist from 'euclidean-distance'

import word2vec from '../data/诗词数据/word2vec.json'
import yunmu2pingyin from '../data/诗词数据/韵母2拼音.json'

import dijkstra from 'dijkstrajs'

import relation_ships from '../data/年谱信息/关系.json'

import year2bigevents from '../data/年谱信息/历史大事件.json';

class DataStore{
    constructor(){
        this.word2vec = word2vec
        this.year2big_events = year2bigevents
        
        this.nian_pu = {
            '辛弃疾': xingqiji_nianpu.lines.filter(elm=> elm.Detail).map(elm=> new Addr(elm)),
            '苏轼': sushi_nianpu.lines.filter(elm=> elm.Detail).map(elm=> new Addr(elm))
        }
        this.nian_pu_cbdb = {
            '辛弃疾': xingqiji_nianpu_cbdb,
            '苏轼': sushi_nianpu_cbdb
        }

        let author2poem = {}
        all_songci.forEach(songci=>{
            const {author} = songci
            author2poem[author] = author2poem[author] || []
            author2poem[author].push(songci)

            let first_paragraph = songci.paragraphs[0]
            songci.name = first_paragraph.split('，')[0].replace('。', '')

            // 给事件时间绑定
            const has_bianian_poets = ['苏轼', '辛弃疾']
            has_bianian_poets.forEach(poet_name=>{
                if(author===poet_name){
                    let poetry_info = undefined
                    if(author==='苏轼')
                        poetry_info = sushi_potery_info
                    else if(author==='辛弃疾')
                        poetry_info = xingqiji_potery_info
                    const name = songci.name
                    
                    if (poetry_info[name]) {
                        songci.info = poetry_info[name]
                        // console.log(name)
                    }else{
                        let min_name = 0, min_dist = 9999
                        for(let this_name in poetry_info){
                            const dist = levenshtein.get(this_name, name)
                            // console.log(this_name, name, dist)
                            if(dist<min_dist){
                                min_dist = dist
                                min_name = this_name
                            }
                        }
                        if (min_dist<=2) {
                            songci.info = poetry_info[min_name]
                        }
                        // console.log(songci.name, songci.info.poetry_name, min_dist)
                    }
                }
            })
        })
        this.author2poem = author2poem
        this.poteries = all_songci

        this.word2yun = {}
        this.pingshuiyun = pingshuiyun
        this.yuns = Object.keys(this.pingshuiyun)
        this.yun2simp_yun = {}
        for(let yun in this.pingshuiyun){
            let elm = this.pingshuiyun[yun].split('')
            this.pingshuiyun[yun] = elm
            elm.forEach(word=> {
                this.word2yun[word] = yun
                // this.word2yun[word] = this.word2yun[word] || []
                // this.word2yun[word].push(yun)
            })
        }

        let word2hanlin = {}
        for(let bu in hanling_zhengyun){
            const text = hanling_zhengyun[bu].split('')
            text.forEach(word=>{
                word2hanlin[word] = bu
            })
        }
        this.hanling_zhengyun = word2hanlin

        this.simp_yuns = this.yuns.map(yun=>{
            const replace_list = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '声', '平', '上', '去', '入']
            let simp_yun = yun
            replace_list.forEach(word=>{
                simp_yun = simp_yun.replace(word, '')
            })
            replace_list.forEach(word=>{
                simp_yun = simp_yun.replace(word, '')
            })
            this.yun2simp_yun[yun] = simp_yun
            return simp_yun
        })
        // console.log(this.simp_yuns.join(''))
        this.simp_yun2pingyin = yunmu2pingyin

        this.constructorNetWork()
    }

    constructorNetWork(){
        var relation_graphs = {}, person2reltions = {}
        relation_ships.forEach(relation_ship=>{
            const {p1, p2, type} = relation_ship
            relation_graphs[p1] = relation_graphs[p1] || {}
            relation_graphs[p2] = relation_graphs[p2] || {}
            relation_graphs[p1][p2] = 1
            relation_graphs[p2][p1] = 1

            person2reltions[p1] = person2reltions[p1] || {}
            person2reltions[p2] = person2reltions[p2] || {}
            person2reltions[p1][p2] = person2reltions[p1][p2] || [] //type
            person2reltions[p2][p1] = person2reltions[p2][p1] || []
            person2reltions[p1][p2].push(type)
            person2reltions[p2][p1].push(type)
        })
        // console.log(dijkstra.find_path(relation_graphs, '苏轼', '宋偓'))
        this.relation_graphs = relation_graphs
        this.person2reltions = person2reltions
        this.person2dijkstra_graph = {}
    }

    constructDijGraph(person){
        // console.log(person)
        const max_depth = 2, p2depth = {}
        const {person2reltions} = this
        if (!person2reltions[person]) {
            console.warn(person, '没有关系数据')
            return {}
        }
        const getRelatedPeople = person =>{
            return Object.keys(person2reltions[person])
        }
        const queue = [person]
        p2depth[person] = 0
        while(queue.length!==0){
            let p = queue.pop(), related_p = getRelatedPeople(p)
            // console.log(p)
            let p_depth = p2depth[p]
            related_p.forEach(elm=>{
                let elm_depth = p2depth[elm]
                if (elm_depth || elm_depth===0) {
                    if (elm_depth>p_depth+1) {
                        elm_depth = p_depth+1
                        p2depth[elm] = elm_depth
                        if (elm_depth<max_depth) {
                            queue.push(elm)
                        }
                    }
                }else{
                    elm_depth = p_depth + 1
                    p2depth[elm] = elm_depth
                    if (elm_depth<max_depth) {
                        queue.push(elm)
                    }
                }
            })
        }
        return p2depth
    }

    // 找到范围内的共同好友
    myDijkstra(p1, p2){
        const {person2dijkstra_graph} = this
        const net_work1 = person2dijkstra_graph[p1] || this.constructDijGraph(p1),
              net_work2 = person2dijkstra_graph[p2] || this.constructDijGraph(p2)
        person2dijkstra_graph[p1] = net_work1
        person2dijkstra_graph[p2] = net_work2
        // console.log(net_work)

        let rel_p1 = Object.keys(net_work1),  rel_p2 = Object.keys(net_work2)
        // rel_p1 = new Set(rel_p1)
        rel_p2 = new Set(rel_p2)
        let int_p = rel_p1.filter(elm=> rel_p2.has(elm))

        return int_p //.filter(p=> !(net_work1[p]===2&&net_work2[p]===2))
    }

    findReltionsBetween(p1, p2){
        try {
            let path = dijkstra.find_path(this.relation_graphs, p1, p2)
            return path
        } catch (error) {
            // console.error(error)
        }
        return []
    }
    getWord2vec(word){
        let vec = this.word2vec[word]
        if(vec)
            return vec
        // console.warn(word, '没有vec');
        const vec_length = this.word2vec[Object.keys(this.word2vec)[0]].length
        return new Array(vec_length).fill(0)
    }

    getPoetries(){
        const {center_person} = stateManager
        
        return (this.author2poem[center_person] || []) 
        // .map(elm=>{
        //     elm.info = elm.info || {}
        //     return elm
        // })
    }
    getTime2Poetry(){
        const poet_name = stateManager.center_person
        let poetries = this.getPoetries(poet_name).filter(elm=> elm.info)
        // console.log(poetries)
        let year2poetry = {}
        poetries.forEach(elm=>{
            const {time} = elm.info
            if (time!=='') {
                year2poetry[time] = year2poetry[time] || []
                year2poetry[time].push(elm)                
            }
        })
        // console.log(year2poetry)
        return year2poetry
    }
    getAddr2Poetry(){
        const poet_name = stateManager.center_person
        let poetries = this.getPoetries(poet_name).filter(elm=> elm.info)
        // console.log(poetries)
        let addr2poetry = {}
        poetries.forEach(elm=>{
            const {location} = elm.info
            addr2poetry[location] = addr2poetry[location] || []
            addr2poetry[location].push(elm)
        })
        // console.log(year2poetry)
        return addr2poetry
    }

    getPoetriesBetweenYears(year_range = [-9999, 9999]){
        const year2poetry = this.getTime2Poetry()
        let poetries = []
        for (let year = year_range[0]; year <= year_range[1]; year++) {
            const this_poetries = year2poetry[year.toString()]
            if (this_poetries) {
                poetries = [...poetries, ...this_poetries]
            }
        }
        return poetries
    }

    getPoetriesBetweenAddr(addrs){
        const addr2poetry = this.getAddr2Poetry()
        let poetries = []
        addrs.forEach(elm=>{
            const {name} = addrs
            if(addr2poetry[name])
                poetries = [...poetries, ...addr2poetry[name]]
        })  
        return poetries
    }

    getWordCount(poetries){
        const countWord = words=>{
            let word2count = {}
            // const ignore_word = new Set(['，',',','。','、'])
            words.forEach(elm=>{
                word2count[elm] = word2count[elm] || 0
                word2count[elm]++
            })

            let data = []
            for(let word in word2count){
                data.push({
                    text: word,
                    value: word2count[word]
                })
            }
            return data
        }
        let words = []
        poetries.forEach(elm=>{
            words = [...words, ...elm.words.reduce((total, words)=>{
                return [...total, ...words]
            }, [])]
        })

        return countWord(words)
    }

    getNianPuSortByPlace(){
        const poet_name = stateManager.center_person
        return this.nian_pu[poet_name]
    }

    getNianPuSortByTime(){
        const poet_name = stateManager.center_person
        let nian_pu = this.nian_pu[poet_name]
        let sort_nian_pu = []
        nian_pu.forEach(addr=>{
            sort_nian_pu = [...sort_nian_pu, ...addr.events]
        })

        let time2event = {}
        sort_nian_pu.forEach(elm=> {
            const time = elm.time.getTime()
            time2event[time] = time2event[time] || []
            time2event[time].push(elm)
        })
        let times = Object.keys(time2event).sort((a,b)=> a-b)

        // console.log(time2event, times)
        sort_nian_pu = []
        times.forEach((time,index)=>{
            let events = []
            let unsort_events = time2event[time]
            if(index===0){
                events = unsort_events.sort((a,b)=> a.index_time-b.index_time)
            }else{
                let former_event = sort_nian_pu[sort_nian_pu.length-1]
                // 这里似乎有些慢
                while(unsort_events.length!==0){
                    unsort_events = unsort_events.sort((a,b)=> a.dist(former_event) - b.dist(former_event) )
                    events.push(unsort_events[0])
                    former_event = unsort_events[0]
                    unsort_events = unsort_events.filter(elm=> elm!==unsort_events[0])
                }

            }
            sort_nian_pu = [...sort_nian_pu, ...events]
        })

        // sort_nian_pu = sort_nian_pu.sort((a,b)=> a.index_time-b.index_time)
        // console.log(sort_nian_pu)
        return sort_nian_pu
    }
    getYear2Score(){
        const poet_name = stateManager.center_person
        let events = this.nian_pu_cbdb[poet_name]
        let certain_events = events.filter(elm => elm.time_range[0]!==-9999)
        let years = certain_events.map(elm=> elm.time_range[0])
        years = [...new Set(years)]

        const getGuanzhiScore = guanzhi =>{
            let pingji = ['正一品','从一品','正二品','从二品','正三品','从三品','正四品上','正四品','正四品下','从四品上', '从四品', '从四品下','正五品上','正五品', '正五品下','从五品上', '从五品','从五品下','正六品上','正六品','正六品下','从六品上', '从六品', '从六品下','正七品上', '正七品', '正七品下', '从七品上', '从七品', '从七品下', '正八品上','正八品', '正八品下','从八品上','从八品', '从八品下', '正九品下', '正九品', '正九品下','从九品上', '从九品', '从九品下']
            pingji = pingji.reverse()

            let this_pingji = guanzhi2pingji[guanzhi]
            if (!this_pingji) {
                return 0
            }
            if (guanzhi==='朝请大夫') {
                this_pingji = '从四品'
            }
            // console.log(this_pingji, guanzhi, pingji.findIndex(elm => elm===this_pingji['品级']))
            return pingji.findIndex(elm => elm===this_pingji['品级'])
        }
        let year2score = {}
        years.forEach(year=>{
            const windows_size = 1
            let related_events = certain_events.filter(event=> event.time_range[0]<=year&&year-event.time_range[0]<windows_size)
            // related_events = related_events.filter(elm=> elm.trigger.name==='担任')
            // console.log(year, related_events)
            // console.log(related_events, years)
            const getImp = event=>{
                const {trigger, roles} = event
                const main_role = roles.filter(elm=> elm.person===poet_name)[0]
                let imp = trigger_imp[trigger.name + ' ' +main_role.role]
                return imp?imp:0.00001
            }
            let total_imp = related_events.reduce((total,event)=>{
                return total + getImp(event)
            },0)
            let score = related_events.reduce( (total,event)=>{
                const this_year = event.time_range[0]
                const {trigger} = event
                let score = trigger.score
                if(trigger.name==='担任'){
                    score = getGuanzhiScore(event.detail)
                    // console.log(score)
                }
                const imp = getImp(event)
                // console.log(trigger.name + ' ' +main_role.role)
                // console.log(imp, score, this_year, year, Math.exp(this_year-year) ,Math.log(imp*score*Math.exp(this_year-year)))
                return total +　Math.log(imp*score*Math.exp(this_year-year)+1) ///total_imp
            }, 0)
            if(score!==0)
                year2score[year] = score
        })
        return year2score
    }
}

class Event{
    constructor(_object, addr, index){
        let {time, activity} = _object
        
        const han2num = {
            '二十日': '20日',
            '三十日': '30日',
            '十日': '10日',
            '二十': '2',
            '三十': '3',
            '一': '1',
            '二': '2',
            '三': '3',
            '四': '4',
            '五': '5',
            '六': '6',
            '七': '7',
            '八': '8',
            '九': '9',
            '十': '1',
            '正': '12',
        }
        for(let key in han2num){
            time =  time.replace(key, han2num[key])
        }

        this.index = index
        this.year = 0
        this.month = 12
        this.day = 31
        if(time.indexOf('-')!=-1){
            this.year = time.split('-')[0]
        }else{
            if(time.indexOf('年')!=-1){
                time = time.split('年')
                this.year = time[0]
                time = time[1]
                if(time && time.indexOf('月')){
                    time = time.split('月')
                    this.month = time[0]
                    time = time[1]
                    if(time && time.indexOf('日')){
                        time = time.split('日')
                        this.day = time[0]
                    }
                }
            }else{
                this.year = time
            }
        }

        this.year = parseInt(this.year)
        this.month = parseInt(this.month)
        this.day = parseInt(this.day)
        this.time = new Date()
        this.time.setFullYear(this.year, this.month, this.day)

        if(isNaN(this.year) || isNaN(this.month) || isNaN(this.year)){
            console.log(_object, this, time)
        }

        this.addr = addr
        this.activity = activity
        this.index_time = this.year * 500 + this.month * 40 + this.day + this.index/1000
    }

    dist(other_event){
        return other_event.addr.dist(this.addr)
    }
}

class Addr{
    dist(other_addr){
        return eucDist([this.x, this.y], [other_addr.x, other_addr.y])
    }
    constructor(_object){
        this.y = _object.Latitude
        this.x = _object.Longitude
        this.name = _object.Title
        this.events = _object.Detail.map((elm, index)=> new Event(elm, this, index))
    }
}
var dataStore = new DataStore()
var arrayEqual = (a,b)=>{
    if(a.length!==b.length)
        return false
    for (let index = 0; index < a.length; index++) {
        if(a[index]!==b[index])
            return false
    }
    return true
}

var potery2text = potery => {
    let text = ''
    potery.paragraphs.forEach(elm=> text+=elm)
    return text
}

var getYun = potery =>{
    let {paragraphs} = potery
    return paragraphs.map(text=> {
        text = text.split('')
        return text.map(word=>{
            // console.log(word,dataStore.word2yun[word] )
            return {
                word: word,
                yun: dataStore.word2yun[word]
            }
        })
    })
}

var getFourYun = word=>{
    const yun = dataStore.word2yun[word]

    if(!yun)
        return ''
    const yuns = ['平声', '上声', '去声', '入声']

    for (let index = 0; index < yuns.length; index++) {
        const element = yuns[index];
        if (yun.indexOf(element)!==-1) {
            return element
        }
    }
    console.error(word, '没有声部')
}

var dictCopy = dict => {
    const copy = {}
    for(let key in dict){
        copy[key] = dict[key]
    }
    return copy
}

const normalizeVec = (vecs)=>{
    if (vecs.length===0) {
      return []
    }
    let vec_length = vecs[0].length
    for (let index = 0; index < vec_length; index++) {
      const max = Math.max(...vecs.map(vec=> vec[index])),
            min = Math.min(...vecs.map(vec=> vec[index]))
      vecs.forEach(vec=>{
        vec[index] = (vec[index]-min)/(max-min)
      })
    }
    return vecs
  }

const biao_dian = new Set(['，','、','。','；','-'])
const shen_mu = new Set(['zh', 'ch', 'sh', 'b', 'p', 'm', 'f', 'd', 't', 'n', 'l', 'ɡ', 'k', 'h', 'j', 'q', 'x', 'r' ,'z', 'c', 's', 'y', 'w'])

const getRandomColor = ()=>{
    var r = Math.round((Math.random()*255)).toString(16);
    var g = Math.round((Math.random()*255)).toString(16);
    var b = Math.round((Math.random()*255)).toString(16);
    var color = "#"+r+g+b;
    return color
}

const ribbonPathString = (sx,sy,sdy,tx,ty,tdy,tension)=>{
	  var m0,m1;
	  return (tension===1?[	      "M", [sx,sy],
	      "L", [tx,ty],
	      "V", ty+tdy,
	      "L", [sx, sy +sdy],
	      "Z"
	    ]:[	      "M", [sx,sy],
	      "C", [m0 = tension*sx+ (1-tension)*tx,sy], " ",
	           [m1 = tension*tx+ (1-tension)*sx,ty], " ", [tx,ty],
	      "V", ty+tdy,
	      "C", [m1,ty+tdy], " ", [m0,sy+sdy], " ", [sx,sy+sdy],
	      "Z"
	    ]).join("");
}


const silkRibbonPathString = (sx,sy,tx,ty,tension)=>{
    var m0, m1;
    return (tension==1?[  "M", [sx,sy],
        "L", [tx,ty],
        //"Z"
        ]:[  "M", [sx,sy],
        "C", [m0 = tension*sx+(1-tension)*tx,sy], " ",
            [m1 = tension*tx+(1-tension)*sx,ty], " ", [tx,ty],
        //"Z"
    ]).join("");
}



export {
    dataStore,
    arrayEqual,
    potery2text,
    getYun,
    getFourYun,
    dictCopy,
    normalizeVec,

    biao_dian,
    shen_mu,

    getRandomColor,

    ribbonPathString,
    silkRibbonPathString,
}