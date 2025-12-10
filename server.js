const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/sample-db')
    .then(() => {
        console.log("MongoDb connect Sucessfully");
    }).catch((err) => {
        console.log("MongoDb connection Sucessfully", err);
    })

const Userschema = new mongoose.Schema({
    userId: { type: Number},
    firstName: {type: String},
    lastName: {type: String},
    userName: { type: String},
    email: { type: String},
    phoneNumber: { type: Number, unique: true },
    password: String,
    loggedIn: { type: Boolean, default: false }
}, { versionKey: false });

const UserData = new mongoose.model("UserDetailsCollection", Userschema)

app.post('/registeration', async (req, res) => {
    try {
        const { firstName, lastName, userName, email, phoneNumber, password } = req.body;

        const userId = Math.floor(100000 + Math.random() * 999999);

        const isUserExist = await UserData.findOne({
            $or: [{ email }, { userName }]
        })

        if (isUserExist != null) {
            if (isUserExist['userName'] == userName) {
                res.json({
                    result_code: "3",
                    result_text: "Username already exist enter unique Name"
                })
                return;
            } else if (isUserExist['email'] == email) {
                res.json({
                    result_code: "3",
                    result_text: "Email already exist enter unique Name"
                });
                return;
            }
        }

        const usersDetails = new UserData({
            firstName,
            lastName,
            userId,
            userName,
            email,
            phoneNumber,
            password,
            loggedIn: false,
        });

        await usersDetails.save();

        res.json({
            result_code: "0",
            result_text: "User Registration Sucessfull"
        })

    } catch (error) {

        res.json({
            result_code: "1",
            result_text: "User Registration failed"
        })

    }

});

app.post("/login", async (req, res) => {
    try {
        const { userName, email, password } = req.body

        const getUser = await UserData.findOne({
            $or: [{ email }, { userName }]
        });

        if (!getUser) {
            return res.json({
                result_code: "3",
                result_text: "User not found"
            });
        }

        if (getUser.password != password) {
            return res.json({
                result_code: "2",
                result_text: "Invalid password"

            });
        }

        getUser.loggedIn = true;
        await getUser.save();

        return res.json({
            result_code: "0",
            result_text: "User login sucessfully",
            userDetails: {
                loggedIn: getUser['loggedIn'] != undefined ? getUser['loggedIn'] : false,
                userId: getUser['userId'] != undefined && getUser['userId'].length != 0 ? getUser['userId'] : '',
                userName: getUser['userName'] != undefined && getUser['userName'].length != 0 ? getUser['userName'] : '',
                firstName: getUser['firstName'] != undefined && getUser['firstName'].length != 0 ? getUser['firstName'] : '',
                lastName: getUser['lastName'] != undefined && getUser['lastName'].length != 0 ? getUser['lastName'] : '',
                phoneNumber: getUser['phoneNumber'] != undefined && getUser['phoneNumber'].length != 0 ? getUser['phoneNumber'] : '',
                email: getUser['email'] != undefined && getUser['email'].length != 0 ? getUser['email'] : getUser['email'],
            }
        });


    } catch (error) {
        res.status(500).json({
            result_code: "1",
            result_text: "Login failed"

        })

    }
});


app.post("/logout", async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await UserData.findOne({ userId });

        if (!user) {
            return res.status(404).json({
                result_code: "1",
                result_text: "User not found"
            });
        };

        user.loggedIn = false;
        user.save();

        return res.json({
            result_code: "0",
            result_text: "Logout Sucessfully",
            loggedIn: user.loggedIn
        });

    } catch (error) {
        return res.status(500).json({
            result_code: "1",
            result_text: "Logout failed"
        });

    };
});

app.post("/editOrUpdateProfile", async (req, res) => {
    try {

        const { firstName, lastName, userId, userName, email, phoneNumber } = req.body;

        const isExistingUser = await UserData.findOne({ userId })

        if (!isExistingUser) {

            return res.json({
                result_code: "2",
                result_text: "User not found"
            });

        }

        await UserData.updateOne({
            userId
        }, {
            $set: {
                firstName,
                lastName,
                userName,
                email,
                phoneNumber
            }
        });

        const updatedUserData = await UserData.findOne({ userId });

        return res.json({
            result_code: "0",
            result_text: "Profile updated successfully",
            userDetails: {
                userId: updatedUserData.userId,
                firstName:updatedUserData.firstName,
                lastName: updatedUserData.lastName,
                userName: updatedUserData.userName,
                phoneNumber: updatedUserData.phoneNumber,
                email: updatedUserData.email,
                loggedIn: updatedUserData.loggedIn
            }
        })

    } catch (error) {
        return res.status(500).json({
            result_code: "1",
            result_text: "Profile failed to updated"
        });

    }
})


const PORT = 4000
app.listen(PORT, () => {
    console.log('Server Connection', `http://localhost:${PORT}`)
})







