const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const app = express()
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require('mongodb');


// Middle Tire
app.use(cors())
app.use(express.json());


const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'UnAuthorized Access' })
  }

  const token = authHeader.split(' ')[1];

  // verify a token asymmetric
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden Access' })
    }
    req.decoded = decoded;
    next();
  });


}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sv50w.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    await client.connect();
    const servicesCollection = client.db("doctors_portal").collection("services");
    const bookingCollection = client.db("doctors_portal").collection("bookings");
    const userCollection = client.db("doctors_portal").collection("users");

    app.get('/services', async (req, res) => {
      const query = {};
      const cursor = servicesCollection.find(query);
      const services = await cursor.toArray();
      res.send(services)
    });

    app.get('/users', verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    })

    app.get('/admin/:email', async (req, res)=>{
      const email= req.params.email;
      const user= await userCollection.findOne({email: email});
      const isAdmin= user.role==='admin';
      res.send({admin: isAdmin})
    })

    app.put('/users/admin/:email', verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({ email: requester });
      if (requesterAccount.role === 'admin') {
        const updateDoc = {
          $set: {
            role: 'admin'
          },
        }
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      }else{
        res.status(403).send({message:'Forbidden'})
      }


    });

    app.put('/users/:email', async (req, res) => {
      const user = req.body;
      const email = req.params.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      }

      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
      res.send({ result, token });

    })

    // Warning Learn mongodb agrregate search
    // This is not the proper way to query
    // after learning more about mongodb use Aggregate, Lockup, pipeline, match

    app.get('/available', async (req, res) => {
      const bookingDate = req.query.date; //should database samename

      // step 1: get all services
      const services = await servicesCollection.find().toArray();

      // step 2 get: the bokking of the date
      const query = { bookingDate: bookingDate }; //should database same name

      const bookings = await bookingCollection.find(query).toArray();

      // // step 3: for each service
      services.forEach(service => {

        // step 4: find bookings for that service
        const serviceBookings = bookings.filter(book => book.serviceName === service.name);

        // step 5: select stots for the serviceBookings
        const bookedSlots = serviceBookings.map(book => book.slot);

        // step 6: select those slots that are not in bookedSlots
        const available = service.slots.filter(slot => !bookedSlots.includes(slot));

        // step 7: set available to slots to make it easier
        service.slots = available;
      })

      res.send(services)
    })


    /**
     * API Naming Convention
     * app.get('/booking)// get all bookings in this collection, or get more than one or by filter
     * app.get('/booking/:id) // get a specific booking
     * app.post('/booking) // add a new booking
     * app.patch('booking/:id')
     * app.put('booking/:id') if exists update if not create (upsert) 
     * app.delete('booking/:id')
    */

    app.get('/booking', verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const bookings = await bookingCollection.find(query).toArray();
        return res.send(bookings);
      } else {
        return res.status(403).send({ message: 'Forbidden Access' })
      }

    })


    app.post('/booking', async (req, res) => {
      const booking = req.body;
      const query = { serviceName: booking.serviceName, bookingDate: booking.bookingDate, patientName: booking.patientName }
      const exist = await bookingCollection.findOne(query);
      if (exist) {
        return res.send({ success: false, booking: exist })
      }
      const result = await bookingCollection.insertOne(booking);
      res.send({ success: true, result });
    })



  } finally {

  }
}

run().catch(console.dir)


app.get('/', (req, res) => {
  res.send('Hello From Doctors Portal')
})

app.listen(port, () => {
  console.log(`Doctors Portal listening on port ${port}`)
})