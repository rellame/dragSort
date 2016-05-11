(function($){
	var shelfSort = function(modal,initData,onSave){
		this.onSave = onSave;
		this.buildComponents(modal);
		//默认参数设置，可在init的时候根据自己的需要覆盖部分或全部的参数
        this.setting = {
            "column":4,//每行个数
            "moduleName":"模块名称",
            "itemHeight":182,//元素的高度
            "itemWidth":251,//元素的宽度
            "modalPadding":8,//整个modal的padding
            "modalBodyPL":12,//modalBody的padding-left
            "modalBodyPT":4,//modalBody的padding-top
            "wrapperWidth":0,//整个modal的宽度
            "scrollWidth":18//滚动条宽度
        };
        $.extend(this.setting,initData);
        //用于计算的变量
        this.globalData = {
        	"draggedItem":null,//被选中的元素
            "selectedItems":[],//被选中的多个元素
            "cloneItem":null,//克隆的元素,
            "hasItemNumTip":false,//初始化克隆元素的标志
            "lastPos":{x:0,y:0,x1:0,y1:0},//克隆元素拖动中的位置
            "eventMove":{x:0,y:0},//光标移动的距离
            "eventLast":{x:0,y:0},//光标最新的位置
            "tarPos":{x:0,y:0,m:0,n:0,index:0},//m,n是即将插入的行和列,index为插入的目标位置
            "move":false,//是否是拖拽移动
            "moved":false,//是否移动
            "initialOrder":null,//初始顺序
            "lastScroll":0//滚动条上次滚动的高度
        };
        this.setSettingValue();
        this.buildEvent();
	};

	shelfSort.prototype = {
		//根据数量、销量、价格排序
        conditionSort : function(obj){
            var btn = obj;
            var sortMethod = btn.hasClass("down")? "up":"down";
            var condition = "";
            if(btn.hasClass("price")){
                sortMethod = btn.hasClass("up")? "down":"up";
                condition = ".sale-price";
            }
            if(btn.hasClass("wish"))
                condition = ".wish-num";
            if(btn.hasClass("sold"))
                condition = ".sold-num";
            this.wishBtn.add(this.soldBtn).add(this.priceBtn).removeClass("down up");
            this.restoreBtn.removeClass("restored");
            btn.addClass(sortMethod);
            var i= this.items.length-1;
            while (i> 0) {
                var pos= 0;
                for (var j= 0; j< i; j++)  {
                    var before = this.items.eq(j).find(condition).text().trim()*1;
                    var after = this.items.eq(j+1).find(condition).text().trim()*1;
                    if(((before < after) && (sortMethod == "down")) || ((before > after) && (sortMethod == "up"))){
                        pos = j;
                        this.items.eq(j+1).insertBefore(this.items.eq(j));
                    }
                    this.items = this.getLatestItems();
                }
                i= pos;
            }
        },
        //取消拖拽排序
        cancel : function(){
            this.modal.detach();
        },
        //保存顺序，最新的顺序在order里面，onSave回调可根据不同的需求自定义
        save : function(){
            var items = this.getLatestItems();
            var order = [];
            items.each(function( ){
                var id = $(this).find(".item-id").text();
                order.push(id);
            });
            this.onSave(order);
        },
        //还原顺序
        restore : function(){
            var items = this.globalData.initialOrder;
            this.wishBtn.add(this.soldBtn).add(this.priceBtn).removeClass("down up");
            this.restoreBtn.addClass("restored");
            this.items.detach();
            this.modalBody.append(items);
            this.items = this.getLatestItems();
        },
        deleteItem : function(obj,event){
            this.stopProp(event);
            var deleteBtn = obj;
            deleteBtn.closest(".modal-item").remove();
            this.items = this.getLatestItems();
        },
        stopProp : function(event){
            if(event.stopPropagation){
                event.stopPropagation();
            }else{
                event.cancelBubble = true;
            }
        },
        itemBlur : function(event){
            var e=event.target;
            var selectedItems = this.items.filter(".selected");
            if((selectedItems.length > 0) && $(e).closest(".selected").length === 0){
                selectedItems.removeClass("selected");
                this.globalData.selectedItems=[];
            }
        },
        //插入被拖拽的元素到新的位置，移除掉克隆的元素
        mouseup : function(){
            if(!this.globalData.move) return false;
            var targetIndex = this.globalData.tarPos.index;
            var beforeItems = null;//在目标位置之前的元素
            var afterItems = null;//在目标位置之后的元素
            var lastItem = null;//被选中元素中的最后一个
            var firstInArr = false;//插入到第一个元素之后的标志
            var lastInArr = false;//插入到最后一个元素之前的标志
            var hasBefore = false;//插入的位置之前有元素需要被插入
            var hasAfter = false;//插入的位置之后有元素需要被插入
            var targetIndexAmongArr = false;//目标位置在队列中的标志
            this.globalData.move = false;
            this.globalData.cloneItem.remove();
            //插入实现
            if(this.globalData.moved){
                //插入的位置在第0个
                if(targetIndex == 0){
                    if(this.globalData.selectedItems[0]==targetIndex){
                        this.globalData.selectedItems.splice(0, 1);
                        firstInArr = true;
                    }
                    afterItems = this.items.eq(this.globalData.selectedItems[0]);
                    for(var i = 1; i < this.globalData.selectedItems.length; i++){
                        afterItems = afterItems.add(this.items.eq(this.globalData.selectedItems[i]));
                    }
                    if(firstInArr){
                        afterItems.insertAfter(this.items.eq(0));
                    }
                    else{
                        afterItems.insertBefore(this.items.eq(0));
                    }
                }
                //插入的位置在第1个和最后一个之间（包括第1个和最后一个）
                else if(targetIndex > 0 && targetIndex < this.items.length){
                    for(var i = 0; i < this.globalData.selectedItems.length;i++){
                        if(this.globalData.selectedItems[i] <= targetIndex){
                            if(beforeItems !== null){
                                beforeItems = beforeItems.add(this.items.eq(this.globalData.selectedItems[i]));
                            }
                            if(!hasBefore){//初始化
                                beforeItems = this.items.eq(this.globalData.selectedItems[i]);
                                hasBefore = true;
                            }
                            if(this.globalData.selectedItems[i] == targetIndex){
                                targetIndexAmongArr = true;
                            }
                        }
                        else if(this.globalData.selectedItems[i] > targetIndex){
                            if(afterItems !== null){
                                afterItems = afterItems.add(this.items.eq(this.globalData.selectedItems[i]));
                            }
                            if(!hasAfter){//初始化
                                afterItems = this.items.eq(this.globalData.selectedItems[i]);
                                hasAfter = true;
                            }
                        }
                    }
                    if(beforeItems !== null){
                        beforeItems.insertBefore(this.items.eq(targetIndex));
                    }
                    if(afterItems !== null){
                        if(targetIndexAmongArr){
                            afterItems.insertAfter(this.items.eq(targetIndex));
                        }
                        else{
                            afterItems.insertBefore(this.items.eq(targetIndex));
                        }
                    }
                }
                //插入的位置在最后一个之后
                else if(targetIndex == this.items.length){
                    lastItem = this.globalData.selectedItems[this.globalData.selectedItems.length-1];
                    if((lastItem==targetIndex) || (lastItem==targetIndex-1)) {
                        this.globalData.selectedItems.splice(this.globalData.selectedItems.length - 1, 1);
                        lastInArr = true;
                    }
                    beforeItems = this.items.eq(this.globalData.selectedItems[0]);
                    for(var i = 1; i < this.globalData.selectedItems.length; i++){
                        beforeItems = beforeItems.add(this.items.eq(this.globalData.selectedItems[i]));
                    }
                    if(lastInArr){
                        beforeItems.insertBefore(this.items.eq(this.items.length-1));
                    }
                    else{
                        beforeItems.insertAfter(this.items.eq(this.items.length-1));
                    }
                }
                this.items.removeClass("selected");
                this.globalData.selectedItems = [];
                this.globalData.hasItemNumTip = false;
            }

            this.items.removeClass("target");
            this.globalData.moved = false;
        },
        //移动克隆item
        move : function(obj,event){
            if(!this.globalData.move) return false;
            if((event.pageX==this.globalData.eventLast.x) && (event.pageY==this.globalData.eventLast.y)) return false;
            this.globalData.moved = true;
            var scrollTop = this.modalBody.scrollTop();
            var button = "<button>"+this.globalData.selectedItems.length+"&nbsp;&nbsp;件商品</button>";
            //初始化克隆item
            if(!this.globalData.hasItemNumTip) {
                var cloneLeft = this.globalData.draggedItem.offset().left-this.modalBody.offset().left;
                var cloneTop = this.globalData.draggedItem.offset().top+this.modalBody.scrollTop()-this.modalBody.offset().top;
                this.globalData.cloneItem.removeClass("modal-item selected")
                    .addClass("modal-clone")
                    .css({
                        zIndex:1,
                        position:"absolute",
                        marginTop:0,
                        left:cloneLeft,
                        top:cloneTop,
                        cursor:"move"
                    })
                    .appendTo(this.modalBody);
                $(button).css({
                    position: "absolute",
                    top: 62,
                    left:66,
                    zIndex: 2,
                    width: 109,
                    height: 40,
                    color: "rgb(72, 129, 212)",
                    border:"none",
                    textAlign: "center",
                    background: "rgb(204, 255, 255)"
                })
                .appendTo(this.globalData.cloneItem);
                this.globalData.lastPos.x = cloneLeft;
                this.globalData.lastPos.y = cloneTop;
                this.globalData.hasItemNumTip = true;
            }
            else{
                this.globalData.eventMove.x = event.pageX-this.globalData.eventLast.x;
                this.globalData.eventMove.y = event.pageY-this.globalData.eventLast.y;

                this.globalData.eventLast.x = event.pageX;
                this.globalData.eventLast.y = event.pageY;

                //获取克隆item的当前位置
                this.globalData.lastPos.x = this.globalData.lastPos.x + this.globalData.eventMove.x;
                this.globalData.lastPos.y = this.globalData.lastPos.y + this.globalData.eventMove.y+scrollTop-this.globalData.lastScroll;
                this.globalData.lastPos.y1 = this.globalData.lastPos.y+this.setting.itemHeight;

                if(this.globalData.lastPos.x < 0){
                    this.globalData.lastPos.x = 0;
                }
                if(this.globalData.lastPos.x > this.setting.wrapperWidth) {
                    this.globalData.lastPos.x = this.setting.wrapperWidth;
                }
                if(this.globalData.lastPos.y < 20) {
                    this.globalData.lastPos.y = 20;
                }
                this.globalData.cloneItem.addClass("moving");
                this.globalData.cloneItem.css({
                    left:this.globalData.lastPos.x,
                    top:this.globalData.lastPos.y
                });
                //计算目标位置
                this.globalData.tarPos.m = Math.round((this.globalData.lastPos.y - this.setting.modalBodyPT)/(this.setting.itemHeight));
                this.globalData.tarPos.n = Math.round((this.globalData.lastPos.x - this.setting.modalBodyPL)/(this.setting.itemWidth));
                this.globalData.tarPos.index = this.globalData.tarPos.m*this.setting.column+this.globalData.tarPos.n;
                if(this.globalData.tarPos.index >= this.items.length){
                    this.globalData.tarPos.index = this.items.length;
                }
                this.items.removeClass("target");
                this.items.eq(this.globalData.tarPos.index).addClass("target");
                this.globalData.lastScroll = scrollTop;
            }
        },
        //元素被选中，获取初始数据，设置克隆item并为之设置css
        itemSelected : function(obj,event){
            var clickItem = obj;
            var itemIndex = clickItem.index();
            var arrLength = this.globalData.selectedItems.length;
            var ifSelected = $(clickItem).hasClass("selected");
            var inArray = false;//判断被选中的item是否已经在队列中

            this.stopProp(event);
            this.items = this.getLatestItems();

            //ctrl被按下
            if(event.ctrlKey) {
                //取消已选item
                if(ifSelected) {
                    $(clickItem).removeClass("selected");
                    for(var i = 0; i < arrLength; i++) {
                        if(this.globalData.selectedItems[i] === itemIndex) {
                            this.globalData.selectedItems.splice(i,1);
                            break;
                        }
                    }
                }
                //增加选中的item
                else if(!ifSelected){
                    $(clickItem).addClass("selected");
                    if(arrLength == 0){
                        this.globalData.selectedItems.push(itemIndex);
                    }
                    else if(arrLength > 0) {
                        //将选中的item按下标从小到大的顺序插入到队列中
                        for(var i = 0; i < arrLength; i++) {
                            if(itemIndex < this.globalData.selectedItems[i]) {
                                this.globalData.selectedItems.splice(i,0,itemIndex);
                                break;
                            }
                            if(i === (arrLength-1)) {
                                this.globalData.selectedItems.push(itemIndex);
                            }
                        }
                    }
                }
            }else if(!event.ctrlKey){//未按下ctrl
                //非多选
                if((arrLength === 0) || (arrLength === 1)) {
                    this.items.removeClass("selected");
                    $(clickItem).addClass("selected");
                    this.globalData.selectedItems = [];
                    this.globalData.selectedItems.push(itemIndex);
                }
                //多选
                else if(arrLength > 1){
                    for(var i = 0; i<arrLength; i++){
                        if(itemIndex === this.globalData.selectedItems[i]){
                            inArray = true;
                            break;
                        }
                    }
                    if(!inArray) {
                        this.items.removeClass("selected");
                        $(clickItem).addClass("selected");
                        this.globalData.selectedItems = [];
                        this.globalData.selectedItems.push(itemIndex);
                    }
                }
                this.globalData.draggedItem = clickItem;
                //克隆被选中的item
                this.globalData.cloneItem = obj.clone();
                //为下次定位保存基础数据
                this.globalData.eventLast.x = event.pageX;
                this.globalData.eventLast.y = event.pageY;
                this.globalData.lastScroll = this.modalBody.scrollTop();
                this.globalData.move = true;
                this.globalData.moved = false;
            }
        },
        buildEvent : function(){
            var _this = this;
            this.items.mousedown(function(event){
                _this.itemSelected($(this),event);
            });
            this.items.keydown(function(event){
            	//按下ctrl+鼠标左键
                if(event.ctrlKey && event.which==1){
                    _this.itemSelected($(this),event);
                }
            });
            this.doc.mousemove(function(event){
                _this.move($(this),event);
            }).mouseup(function(){
                _this.mouseup();
            });
            this.modal.click(function(event){
                if($(event.target).closest(".modal-item").length == 0) {
                    _this.itemBlur(event);
                }
            });
            this.itemLinks.mousedown(function(event){
                _this.stopProp(event);
            });
            this.pics.mousedown(function(event){
                event.preventDefault();
            });
            this.deleteBtn.mousedown(function(event){
                _this.deleteItem($(this),event);
            });
            this.saveBtn.click(function(){
                _this.save();
            });
            this.cancelBtn.click(function(){
                _this.cancel();
            });
            this.closeBtn.click(function(){
                _this.cancel();
            });
            this.restoreBtn.click(function(){
                _this.restore();
            });
            this.wishBtn.click(function(){
                _this.conditionSort($(this));
            });
            this.soldBtn.click(function(){
                _this.conditionSort($(this));
            });
            this.priceBtn.click(function(){
                _this.conditionSort($(this));
            });
            this.window.resize(function(){
                _this.setSettingValue();
            });
        },
        buildComponents : function(modal){
            this.modal = modal;
            this.moduleName = this.modal.find(".modal-header .tit");
            this.wishBtn = this.modal.find(".wish");
            this.soldBtn = this.modal.find(".sold");
            this.priceBtn = this.modal.find(".price");
            this.saveBtn = this.modal.find("#save");
            this.cancelBtn = this.modal.find("#cancel");
            this.restoreBtn = this.modal.find(".restore");
            this.closeBtn = this.modal.find(".close");
            this.modalBody = this.modal.children(".modal-body");
            this.items = this.modalBody.children(".modal-item");
            this.details = this.modalBody.children(".item-detail");
            this.pics = this.items.find("img");
            this.itemLinks = this.items.find(".item-id");
            this.deleteBtn = this.items.find(".delete");
            this.doc = $(document);
            this.window = $(window);
        },
        //初始化modal和他的所有组件，记录初始的顺序
        setSettingValue : function(){
            var column = this.setting.column;
            var itemNum = this.items.length;
            var itemsWidth = column*this.setting.itemWidth;
            var winH = $(window).height();
            var winW = $(document).width();
            var modalBodyHeight = winH-60-111;
            var row = Math.ceil(itemNum/column);
            var modalBodyRealHeight = row*this.setting.itemHeight+this.setting.modalBodyPT;
            this.setting.wrapperWidth = itemsWidth+this.setting.modalPadding;
            var margin = -(this.setting.wrapperWidth/2);
            //初始化moal
            this.modal.css({
                width:this.setting.wrapperWidth,
                height:winH-60,
                marginLeft:margin
            });
            //如果有滚动条，加上滚动条的宽度
            if(modalBodyRealHeight > modalBodyHeight) {
                itemsWidth=itemsWidth+this.setting.scrollWidth;
                this.modalBody.css("overflow-y","scroll");
            }
            else if(modalBodyRealHeight < modalBodyHeight){
                this.modalBody.css("overflow-y","hidden");
            }
            //初始化modalBody
            this.modalBody.css({"width":itemsWidth,"height":modalBodyHeight});
            this.modal.after("<div class='layer'></div>");
            $(".layer").css({
                "width": winW,
                "height":winH
            });
            this.moduleName.text(this.setting.moduleName);
            //保存初始化顺序
            this.globalData.initialOrder = this.getLatestItems();
        },
        //获取最新的顺序
        getLatestItems : function(){
            return this.modalBody.children(".modal-item");
        }
	};

	shelfSort.init = function(modal,initData){
		var _this_ = this;
		modal.each(function(){
			new _this_($(this),initData);
		});
	};
	window["shelfSort"] = shelfSort;

})(jQuery);