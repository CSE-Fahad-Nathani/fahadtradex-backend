import axios from "axios";
import speakeasy from "speakeasy";



export const generate5paisaAccessToken = async (requestToken) => {
  try {
    const response = await axios.post(
      "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/GetAccessToken",
      {
        head: {
          Key: process.env.FIVEPAISA_APP_KEY,
        },
        body: {
          RequestToken: requestToken,
          EncryKey: process.env.FIVEPAISA_ENCRYPTION_KEY,
          UserId: process.env.FIVEPAISA_USER_ID,
        },
      }
    );

    const data = response.data;

    // ⚠️ Adjust based on actual API response structure
    return {
      accessToken: data.body?.AccessToken,
      clientCode: data.body?.ClientCode,
      raw: data,
    };
  } catch (error) {
    console.error("5paisa API Error:", error?.response?.data || error.message);
    throw new Error("Failed to generate 5paisa access token");
  }
};

// 🔐 Generate TOTP
const generateTOTP = () => {
  return speakeasy.totp({
    secret: process.env.FIVEPAISA_TOTP_SECRET,
    encoding: "base32", // ⚠️ if fails, try "ascii"
  });
};

// 🔥 Get RequestToken
export const generateRequestToken = async () => {
  try {
    const otp = generateTOTP();

    const payload = {
      head: {
        Key: process.env.FIVEPAISA_APP_KEY,
      },
      body: {
        Email_ID: process.env.FIVEPAISA_CLIENT_CODE, // ⚠️ important
        TOTP: otp,
        PIN: process.env.FIVEPAISA_PIN,
      },
    };

    const response = await axios.post(
      "https://Openapi.5paisa.com/VendorsAPI/Service1.svc/TOTPLogin",
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    if (!data?.body?.RequestToken) {
      throw new Error(
        data?.body?.Message || "Failed to generate RequestToken"
      );
    }

    return data.body.RequestToken;
  } catch (error) {
    console.error(
      "RequestToken Error:",
      error?.response?.data || error.message
    );
    throw new Error("Failed to generate RequestToken");
  }
};