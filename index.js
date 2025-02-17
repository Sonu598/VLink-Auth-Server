const express = require("express");
const connection = require("./connection/connection");
const cors = require("cors");
const Razorpay = require("razorpay");
const userRouter = require("./routes/userRoute");
const { paiduserRouter } = require("./routes/paiduserRoutes");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY,
  key_secret: process.env.RAZORPAY_SECRET,
});

// Create Order API
app.post("/create-order", async (req, res) => {
  try {
    const options = {
      amount: req.body.amount * 100, // Amount in paise (e.g., 100 INR = 10000)
      currency: "INR",
      receipt: `order_rcptid_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify Payment Signature
app.post("/verify-payment", (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
    req.body;
  const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
  hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
  const expectedSignature = hmac.digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ success: true, message: "Payment verified successfully!" });
  } else {
    res
      .status(400)
      .json({ success: false, message: "Invalid payment signature" });
  }
});

app.use("/paiduser", paiduserRouter);
app.use("/user", userRouter);
//app.use(auth)
//app.use("/", postRouter)
app.listen(process.env.Port, async () => {
  try {
    await connection;
    console.log("Connected to Database succesfully");
    // await client.connect();
    // console.log("connected to redis");
  } catch (error) {
    console.log(error.message);
    console.log("Some error while connicting to DB");
  }
  console.log(`server is connected to port no ${process.env.Port}`);
});
