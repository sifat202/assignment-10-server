const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
// var admin = require("firebase-admin");
const dns =require("dns")
dns.setServers([
  '1.1.1.1',
  '8.8.8.8'
])
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
  console.log('login info')
  next();
}
const verifyFirebase = async (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  // console.log(token)



  if (!token) {
    return res.send({ message: "error about access" })
  }
 
  // }
  // catch{
  // return res.send({message: "error with access"})
  // };
  next();
}



// var serviceAccount = require("./admin.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount)
// });
//${process.DB_USERNAMEenv.}
// mongodb+srv://${process.DB_USERNAMEenv.}:${process.env.DB_PASS}@cluster0.07firde.mongodb.net/?appName=Cluster0
//${process.env.DB_PASS}
const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.07firde.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    // await client.db("admin").command({ ping: 1 });
    const db = client.db('cfs-assignment-10')
    const foodlistfinal = db.collection("Foodlistfinal")
    // const foodrequestsfinal = db.collection("requested")
    const foodrequestsfinal = db.collection("requestedfinal")
    const foodslist = db.collection("Foods")
  
 
    console.log(" Successfully connected hoise to MongoDB!");

    app.get('/', (req, res) => {
      res.send('Ping hoise!');
    });

    app.patch('/updaterequeststatus/:id', async (req, res) => {
      const requestId = req.params.id;
      const { status,newStatus } = req.body;

      if (!newStatus || (newStatus !== 'accepted' && newStatus !== 'rejected')) {
        return res.status(400).send({ success: false, message: 'Invalid status provided.' });
      }
      
      const query = { _id: new ObjectId(requestId) };
      const updateDoc = {
        $set: {
          reqstatus: newStatus
          ,
          status:status
        }
      };

      try {
        const result = await foodlistfinal.updateOne(query, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: `Request status updated to ${newStatus}` });
        } else {
          res.send({ success: false, message: 'Request item not found or status already set.' });
        }
      } catch (error) {
        console.error('Error updating request status:', error);
        res.status(500).send({ success: false, message: 'Server error during status update.' });
      }
    });
    app.patch('/request/:id', async (req, res) => {
      const foodid = req.params.id;

      const query = { _id: new ObjectId(foodid) }
      const { status, requestername,
        requesterimg,
        requestedfoodid, contact,
        reqlocation,
        reqreason,
        reqstatus, } = req.body;

      const update = {
        $set: {
          status: status,
          requestername: requestername,
          requesterimg: requesterimg,
          requestedfoodid: requestedfoodid,
          reqstatus:reqstatus,
          reqlocation: reqlocation,
          reqreason: reqreason,
          reqcontact: contact
        }
      };

      const updatefood = await foodlistfinal.updateOne(query, update);

      const updatedfood = await foodlistfinal.findOne(query);

      const finalize = await foodrequestsfinal.insertOne(updatedfood);

      res.send({ message: 'we are done', })
      // .catch(err=>({message:'we are done'},err))
    });
    app.get('/allfoods', async (req, res) => {
      const foods = await foodlistfinal.find().toArray();
      res.send(foods)
    });
    app.get('/requestedfoods/:email', async (req, res) => {
      const contributorEmail = req.params.email;

      if (!contributorEmail) {
        return res.send({ message: 'The email query parameter is required to search for your requested foods.' });
      }

      const query = { email: contributorEmail };

      try {
        const requests = await foodlistfinal.find(query).toArray();

        res.send(requests);
      } catch (error) {
        console.error('Error fetching requested foods by contributor email:', error);
        res.status(500).send({ message: 'Server error while fetching requests.' });
      }
    });
    app.get('/myfoods', async (req, res) => {
      const useremail = req.query.email;

      if (!useremail) {
        return 'errrrorr'
      };
      const query = { email: useremail }

      const food = await foodlistfinal.find(query).toArray()
      res.send(food)
    });
    app.post('/create', async (req, res) => {
      const newfood = req.body;

      const result = await foodlistfinal.insertOne(newfood);
      res.send(result)
    });
    




    app.get('/details/:id', async (req, res) => {
      const foodid = req.params.id;

      const query = { _id: new ObjectId(foodid) }

      const food = await foodlistfinal.findOne(query);

      res.send(food)
    });

    app.patch('/updatefood/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const updatedData = req.body;

        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            title: updatedData.title,
            imgurl: updatedData.imgurl,
            capability: updatedData.capability,
            pickupLocation: updatedData.pickupLocation,
            expireDate: updatedData.expireDate,
            description: updatedData.description,
            contributor: updatedData.contributor,
            contributorPhotoURL: updatedData.contributorPhotoURL,
            email: updatedData.email,
            status: updatedData.status,
          },
        };

        const result = await foodlistfinal.updateOne(query, updateDoc);

        if (result.modifiedCount > 0) {
          res.send({ success: true, message: "Food updated successfully" });
        } else {
          res.send({ success: false, message: "No changes made or food not found" });
        }
      } catch (error) {
        console.error("Error updating food:", error);
        res.status(500).send({ success: false, message: "Server error while updating food" });
      }
    });
    app.delete('/deletefood/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };

        const result = await foodlistfinal.deleteOne(query);

        if (result.deletedCount > 0) {
          res.send({ success: true, message: 'Food deleted successfully' });
        } else {
          res.send({ success: false, message: 'Food not found' });
        }
      } catch (err) {
        console.error('Error deleting food:', err);
        res.status(500).send({ success: false, message: 'Server error while deleting food' });
      }
    });


    app.get('/updateinfo/:id', async (req, res) => {
      const foodid = req.params.id;

      const query = { _id: new ObjectId(foodid) }

      const food = await foodlistfinal.findOne(query);

      if (!food) {
        return res.status(404).send({ message: "Food item not found." });
      }

      res.send(food);
    });
    // app.get('/updateinfo',logger,verifyFirebase, async (req, res) => {
    //   const foodid = req.headers.food;

    //   const query = { _id: new ObjectId(foodid) }

    //   const food = await foodslist1.findOne(query);

    //   res.send(food)
    // })



    app.get('/presorted', async (req, res) => {
      const foodsorted = await foodlistfinal.find().sort({ "capability": -1 }).toArray();
      res.send(foodsorted)
    })
    app.post('/test', (req, res) => {

      const cursor = foodlistfinal.insertOne(req.body)

      res.send(cursor)
    })

    app.listen(port, () => {
      console.log(`🚀 Server chole hene at http://localhost:${port}`);
    });

  } catch (error) {
    console.error(" Error hoise re bhai:", error);
  }
}

run().catch(console.dir);






































// app.get('/testget', async (req, res) => {
//   const query = await foodlistfinal.find().toArray();
//   res.send(query);
// });
//     app.delete('/deletefood/:id', async (req, res) => {
//   const foodid = req.params.id;

//   const query = { _id: new ObjectId(foodid) };
//   const result = await foodslist1.deleteOne(query);

//   res.send(result);
// });

//     app.patch('/editfood/:id', async (req, res) => {
//   const foodid = req.params.id;
//   const updatedData = req.body;


//   const query = { _id: new ObjectId(foodid) };
//   const updateDoc = {
//     $set: {


//     title: updatedData.title,
//     imgurl: updatedData.imgurl,
//     capability: updatedData.capability,
//     pickupLocation: updatedData.pickupLocation,
//     expireDate: updatedData.expireDate,
//     description: updatedData.description,
//     contributorPhotoURL: updatedData.contributorPhotoURL,
//     email: updatedData.email,
//     contributor: updatedData.contributor,
//     status: updatedData.status,
//   }}

//   const result = await foodslist1.updateOne(query, updateDoc);
//   res.send(result);
// });