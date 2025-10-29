export class ApiResponse {
  constructor(statusCode = 200, data = null, message = "") {
    this.statusCode = statusCode;
    this.data = [data];
    this.success = statusCode >= 200 && statusCode < 300;
    this.message = message;
  }

  send(res) {
    // Send JSON response
    return res.status(this.statusCode).json({
      statusCode:this.statusCode,
      success: this.success,
      message: this.message,
      data: this.data,
    });
  }
}


