import { Component } from '@angular/core';

const todos = [
  {
    id:1,
    title:'吃饭',
    done:true
  },
  {
    id:2,
    title:'睡觉',
    done:false
  },
  {
    id:3,
    title:'学习',
    done:false
  }
]

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {  //组件类
  public todos:{
    id:number,
    title:string,
    done:boolean
      // window.localStorage.getItem('todos')拿到的是字符串，需要通过JSON.parse()把它转换成对象。
      // 因为可能会没有数据，没有数据的时候，给空数组 '[]'
  }[]=JSON.parse(window.localStorage.getItem('todos')||'[]');


  //{}是一个对象，为什么要给它赋值为null呢？因为null是所有类型的子类型。
  //因为当前没有双击任务项，所以给它一个初始值null。
  public currentEditing:{  //中间变量 当前被双击的label
    id:number,
    title:string,
    done:boolean
  }=null


  //添加任务
  addTodo(e):void{
    const titleText=e.target.value;
    if(!titleText.length){
      return;
    }

    const last=this.todos[this.todos.length-1];  //对象数组的最后一项

    this.todos.push({
      id:last?last.id+1:1,  //id自增
      title:titleText,
      done:false
    });

    //清空文本框
    e.target.value='';
    //console.log(this.todos);  //测试
  }

  //如果所有任务都完成了,返回true。否则返回false。
  get toggleAll(){
    return this.todos.every(t=>t.done)
  }

  set toggleAll(val){   //toggleAll不是一个方法，而是一个属性
    this.todos.forEach(t=>t.done=val);
  }

  //删除单项任务
  removeTodo(index:number):void{
    //console.log(index);
    this.todos.splice(index,1); //从下标为index的元素开始删除，删除1个
  }

  //回车时，当前任务更新为修改后的内容
  saveEdit(e,todo):void{
    //当前任务更新为修改后的内容。   e.target 是当前DOM元素
    todo.title=e.target.value;
    //恢复非编辑样式
    this.currentEditing=null;
  }

  //处理编辑时的键盘点击事件
  handleEditKeyUp(e):void{
    // 解构赋值
    const {keyCode,target}=e;  
    //console.log(keyCode);
    if(keyCode===27){
      //因为点击ESC的时候，也是失去焦点(触发blur事件执行saveEdit方法保存编辑的内容)，这样的话撤销编辑这个功能就失效了。
      //解决：撤销编辑(点击ESC)时，先将文本框的内容恢复回原来的值
      target.value=this.currentEditing.title;
      //再恢复非编辑样式
      this.currentEditing = null;
    }
  }

  
  /**
   * 求：剩余数量  即：未完成的任务的数量
   * filter 会将符合条件的项放在一个新的数组里并返回。
   * 所以 this.todos.filter(t=>!t.done) 的结果是一个由未完成的任务项组成的数组。
   * .length就可以求出这个数组的长度，即未完成的任务数量。
   * filter过滤器，过滤条件是 t=>!t.done ，是一个箭头函数，等价于  (t)=>{ !t.done }。t 是遍历到的todos中的某一个项
   *
   * remainingCount是一个带有方法的属性，它是一个属性。在使用的时候将它当作一个属性用，而不是当作方法来调用
   * */ 
  get remainingCount(){  
    return this.todos.filter(t=>!t.done).length;
  }

  //清除所有已完成的任务
  clearAllDone():void{
    //const remainingTodo=this.todos.filter(t=>!t.done);
    //console.log(remainingTodo);
    
    this.todos=this.todos.filter(t=>!t.done);
  }


  //visibility记录用户点击的是All、Active还是Completed。默认是all
  public visibility:string ='all';  

  //将window.onhashchange函数包裹着ngOnInit钩子函数里再放到组件类中，就不会报错了。
  //Angular 声明周期钩子函数，在Angular应用初始化的时候执行一次。
  //可以在这里拿到组件类实例，从而访问和修改组件类实例中的成员。
  ngOnInit(){

    //初始化的时候调用一次,这样子无论在all页面、active页面还是completed页面，刷新之后仍保留当前页面
    this.hashchangeHandle();

    //将这个方法赋值给window.onhashchange这个函数，这样的话this就指向window了。
    //所以要通过bind来让this指向当前组件类实例。bind传入的参数是当前组件类实例this
    window.onhashchange=this.hashchangeHandle.bind(this);  
  }

  //锚点改变事件  (动态改变visibility的值)
  hashchangeHandle(){
      //当用户点击了锚点，我们获取当前锚点标识，然后动态将visibility设置为当前锚点标识
      //Javascript substr(start[,length]) 抽取从start下标开始的指定数目的字符。
      const hash=window.location.hash.substr(1); //从下标1开始抽取
      switch(hash){
        case '/':
          this.visibility='all';
          break;
        case '/active':
          this.visibility='active';
          break;
        case '/completed':
          this.visibility='completed';
          break;
      }
  }

  //过滤数据
  get filterTodos(){
    if(this.visibility==='all'){ //当点击All，显示所有任务
      return this.todos;
    }else if(this.visibility==='active'){ //当点击Active，显示未完成的任务
      return this.todos.filter(t=>!t.done);
    }else if(this.visibility==='completed'){ //当点击Completed，显示已完成的任务
      return this.todos.filter(t=>t.done);
    }
  }

  //数据持久化到本地  localStorage
  // 当Angular组件数据发生变化的时候，ngDoCheck钩子函数会被触发
  // 我们要做的就是在这个钩子函数中去持久化我们的todos数据
  ngDoCheck(){
    //将参数2(组件类的todos数据转换成字符串)，存储到参数1(本地的todos)
    window.localStorage.setItem('todos',JSON.stringify(this.todos));
  }

}

