declare global {
  var sendRequestEmail: ((request: any, token: string) => Promise<void>) | undefined
  var sendReminderEmail: ((request: any, token: string) => Promise<void>) | undefined
  var sendConfirmationEmail: ((request: any) => Promise<void>) | undefined
  var sendPositionFilledEmail: ((request: any) => Promise<void>) | undefined
}

export {}