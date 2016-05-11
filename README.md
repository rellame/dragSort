# dragSort
drag and drop,support ctrl multi select.拖拽排序，支持ctrl多选。

可以单个排序也可以按住ctrl多选排序，多选排序的功能类似于windows桌面图标的多选拖拽排序。

可以根据你自己的需要设置，在html调用init方法的时候，设置第二个参数，它会覆盖默认的设置。
同时，还可以传一个回调函数，这个回调函数用于存储最终的顺序。
{
            "column":4,//每行个数
            "moduleName":"模块名称",
            "itemHeight":182,//元素的高度
            "itemWidth":251,//元素的宽度
            "modalPadding":8,//整个modal的padding
            "modalBodyPL":12,//modalBody的padding-left
            "modalBodyPT":4,//modalBody的padding-top
            "wrapperWidth":0,//整个modal的宽度
            "scrollWidth":18//滚动条宽度
        }

前端菜鸟，插件还有许多值得完善的地方，欢迎大家指出，共同进步，谢谢！
