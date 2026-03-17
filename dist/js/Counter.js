export default class Counter {
    constructor(){
        this.value = 1;
    }

    getValue(){
        return this.value
    }

    increamentValue(){
        this.value+=1
    }
}