// routes/chat.js
const express = require('express');
const router = express.Router();
const Conversation = require('../model/conversation');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

// Send a message
router.post('/messages', async (req, res) => {
  const { senderId, recipientId, content } = req.body;

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, recipientId]
      });
    }

    conversation.messages.push({ sender: senderId, content });
    await conversation.save();

    // Broadcast the message to the recipient's socket only
    const recipientSocket = Object.values(io.sockets.sockets).find(
      (socket) => socket.userId === recipientId
    );

    if (recipientSocket) {
      recipientSocket.emit('message', conversation);
    }

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/messages/:conversationId', async (req, res) => {
  const { conversationId } = req.params;

  try {
    const conversation = await Conversation.findById(conversationId)
      .populate('participants', 'email')
      .populate('messages.sender', 'email')
      .exec();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Retrieve conversation history for a user
router.get('/history/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'email')
      .exec();

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/conversation/:userId1/:userId2', async (req, res) => {
  const { userId1, userId2 } = req.params;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [userId1, userId2] }
    })
      .populate('participants', 'email')
      .populate('messages.sender', 'email')
      .exec();

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
