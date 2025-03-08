export class ChatError extends Error {
    responseJson: any;
  
    constructor(message: string, responseJson: any) {
      super(message);
      this.responseJson = responseJson;
    }
}