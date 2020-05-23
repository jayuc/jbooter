/**
 * JBoot 框架核心类
 * Created by 余杰 on 2020/3/18 10:48
 */


    const JBoot = {
        setClass: function (name, clazz) {
            this[name] = clazz;
            this.afterSetClass(name);
        },
        getClass: function (name) {
            const clazz = this[name];
            if(clazz){
                return clazz;
            }
            throw new Error('找不到类， name: ' + name);
        },
        // 声名一个类
        Class: function (properties, skipSetClass) {
            let clazz = typeof properties.initialize === "function" ?
                properties.initialize :
                function(){ properties.prototype.initialize.apply(this, arguments); };
            clazz.prototype = properties;
            if(!skipSetClass){
                this.afterCreateClass(clazz, properties);
            }
            return clazz;
        },
        // 类的继承
        inherit: function (parentClass, properties) {
            let parentClazz = parentClass;
            if(typeof parentClass === 'string'){
                parentClazz = this.getClass(parentClass);
            }
            if(typeof parentClazz === 'function'){
                let the = function () {};
                the.prototype = parentClazz.prototype;
                let clazz = this.Class(properties, true);
                clazz.prototype = new the();
                Object.assign(clazz.prototype, properties);
                this.afterCreateClass(clazz, properties);
                return clazz;
            }else {
                throw new Error('无效的父类');
            }
        },
        // 执行父类的构造方法
        parentConstructor: function (parentClass, that, options) {
            let parentClazz = parentClass;
            if(typeof parentClass === 'string'){
                parentClazz = this.getClass(parentClass);
            }
            if(typeof parentClazz === 'function'){
                try{
                    parentClazz.call(that, options);
                }catch (e){

                }
            }else {
                throw new Error('无效的父类');
            }
        },
        // 创建类后执行
        afterCreateClass: function (clazz, properties) {
            if(typeof properties.CLASS_NAME === 'string'){
                this.setClass(properties.CLASS_NAME, clazz);
            }
        },
        // 注册类后执行
        afterSetClass: function (className) {
            let currentSort = this.currentSort;
            if(currentSort){
                currentSort.next(className);
            }
        },
        // 如果需要则设置属性
        setPropertyIfNeed: function (that, properties, property) {
            if(that && properties){
                let propertyName = property['name'];
                let value = properties[propertyName];
                if(typeof value !== 'undefined'){
                    that[propertyName] = value;
                }else {
                    if(property['required'] && !that[propertyName] && that[propertyName] !== 0){
                        throw new Error(propertyName + ' 为必填属性');
                    }
                }
            }
        },
        // 设置一组属性 例如： [{name: 'data', required: true}]   required: 表示为必填
        setPropertiesIfNeed: function (that, properties, propertyArray) {
            if(propertyArray instanceof Array){
                for(let index in propertyArray){
                    this.setPropertyIfNeed(that, properties, propertyArray[index]);
                }
            }
        },
        // 按顺序加载 js 文件  class
        loadClassBySort: function (arr, onLoad) {
            if(!this.currentSort){
                this.currentSort = new JsLoadSorter();
            }
            this.currentSort.addJsPaths(arr);
            this.currentSort.addLoadedEvent(onLoad);
            this.currentSort.start();
        },
        // 加载 js 文件
        loadJs: loadJs,
    };

    // js 文件加载顺序控制类
    function JsLoadSorter() {
        this.sorter = [];
        this.onLoadEvent = [];
        this.idle = true;
        this.init();
    }
    JsLoadSorter.prototype = {
        init: function () {

        },
        start: function () {
            if(this.idle){
                this.idle = false;
                this.doNext();
            }
        },
        doNext: function () {
            if(this.sorter.length > 0){
                loadJs(this.sorter[0].path);
            }else {   // 加载完后后执行
                this.afterLoad();
            }
        },
        next: function (className) {
            if(this.sorter[0].className === className){
                this.sorter.shift();
                this.doNext();
            }
        },
        afterLoad: function () {

            for(let index in this.onLoadEvent){
                let event = this.onLoadEvent[index];
                if(typeof event === 'function'){
                    event();
                }
            }
            this.onLoadEvent = [];

            removeScriptElement();
            this.idle = true;
        },
        addJsPaths: function (jsPaths) {
            if(jsPaths instanceof Array){
                for(let i in jsPaths){
                    let item = jsPaths[i];
                    if(typeof item === 'object' && item.className && item.path){
                        this.sorter.push(item);
                    }
                }
            }
        },
        addLoadedEvent: function (onLoad) {
            if(typeof onLoad === 'function'){
                this.onLoadEvent.push(onLoad);
            }
        }
    };

    // 加载 js 文件
    function loadJs(src) {
        if(typeof src === 'string' && src.length > 0){

            removeScriptElement();

            let oHead = document.getElementsByTagName('HEAD').item(0);
            let oScript= document.createElement("script");
            oScript.type = "text/javascript";
            oScript.src = src;
            oScript.id = '__jsLoader__';
            oHead.appendChild(oScript);

        }else{
            console.error("脚本路径出错, src: " + src);
        }
    }

    // 删除
    function removeScriptElement() {
        let old = document.getElementById('__jsLoader__');
        if(old){
            old.remove();
        }
    }


JBoot.VERSION_NUMBER = "Base 0.1";


module.exports = JBoot;