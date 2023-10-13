import nodemailer from "nodemailer";

export const sendVerifyMail = (userMail, userName, today, url) => {
  const tranporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.CLIENT_ID,
      pass: process.env.CLIENT_PASS,
    },
  });

  tranporter.verify((error, success) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });
  tranporter.sendMail({
    from: `"Bloody Help"<bloodyhelpyou@gmail.com>`,
    to: `${userMail}`,
    subject: "Bloody Help：電子郵箱驗證",
    html: `<h3>親愛的 ${userName} 先生/小姐，您好，</h3> 
            <br/>
            Bloody Help歡迎您的加入，請<a href="${url}">點擊這裡</a>完成信箱驗證。<br/>
            您的加入日期：${today}
            <br/>
            您的聯絡信箱：${userMail}
            <br/>
            此為系統自動發送，請勿直接回覆`,
  });
};

// get day by date
export const getDay = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return [year, month, day].join("/");
};
