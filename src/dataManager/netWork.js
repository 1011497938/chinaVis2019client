class NetWork {
    constructor(){
        this.fetch_url = 'http://localhost:8000/'
        // this.require('test').then(res => console.log(res))
    }
    url2data = {}
    require(url, par = undefined){
        url = this.fetch_url + url
        if (par) {
            url += '?'
            for(let key in par){
                let elm = par[key]
                if(Array.isArray(elm))
                    elm = elm.join(',')
                url += key + '=' + elm + '&'
            }
            url = url.slice(0,-1)            
        }

        console.log('get', url.slice(0, 50))
        // 已经加个获得过url的data可以直接存着
        return fetch(url,{
            method:'GET',
            headers:{
                'Content-Type':'application/json;charset=UTF-8'
            },
            cache:'default'
        })
        .then(res =>{
            let data = res.json()
            return data
        })            
    }
}

var net_work = new NetWork()
export default net_work