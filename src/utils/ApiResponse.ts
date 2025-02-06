class ApiResponse {
    constructor(
        public statusCode:number,
        public data:object, 
        public message:string = "Success",
        public success:boolean = true
    ){
        this.statusCode = statusCode
        this.data = data
        this.message = message
        //see standard http response code
        this.success = statusCode < 400
    }
}

export { ApiResponse }