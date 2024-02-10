class ApiError extends Error {   // "Error" because it's nodejs inbuild constructor in class of Error.
    constructor(
            statusCode,
            message= "Something went wrong",
            errors = [],
            stack = ""
        ){
        super(message);
        this.statusCode = statusCode;
        this.data = null;
        this.message = message;
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack = stack;
        }else{
            Error.captureStackTrace(this, this.constructor);  //we have to pass refrence of constructor,in Error.captureStackTrace
        }
    }
}

export { ApiError };
