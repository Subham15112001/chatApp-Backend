class ApiError extends Error {
    constructor(
        public statusCode:number,
        public message:string = "something went wrong",
        public errors:string[] = [],
        public stack:string = "",
        public success:boolean = false,
        public data:any = null
    ){
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.success = false;
        this.data = null;
        this.message = message;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}

export {ApiError} 
