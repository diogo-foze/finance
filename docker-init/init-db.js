db = db.getSiblingDB('finansys');

db.users.insertMany([
  {
    "_id": ObjectId("69b7562729955a7a81143409"),
    "name": "Diogo Soares ",
    "email": "diogodsdf@gmail.com",
    "provider": "credentials",
    "__v": 0,
    "role": "admin",
    "updatedAt": new Date("2026-03-17T00:42:27.726Z"),
    "lastActive": new Date("2026-03-17T00:42:27.726Z")
  },
  {
    "_id": ObjectId("69b76072198bc2846bccbdfe"),
    "name": "Fernanda Marchezi",
    "email": "extasemodas@gmail.com",
    "provider": "credentials",
    "role": "admin",
    "createdAt": new Date("2026-03-16T01:44:18.097Z"),
    "updatedAt": new Date("2026-03-17T00:18:11.997Z"),
    "__v": 0,
    "lastActive": new Date("2026-03-17T00:18:11.996Z")
  },
  {
    "_id": ObjectId("69b7653cdb63a6823601fb3c"),
    "name": "Erick Marchezi",
    "email": "erick@gmail.com",
    "provider": "credentials",
    "role": "admin",
    "createdAt": new Date("2026-03-16T02:04:44.657Z"),
    "updatedAt": new Date("2026-03-16T23:12:21.073Z"),
    "__v": 0,
    "lastActive": new Date("2026-03-16T23:12:21.073Z")
  },
  {
    "_id": ObjectId("69b89cabd1af3558cc3f7703"),
    "name": "Diogo Soares Ferreira",
    "email": "webdsdf@gmail.com",
    "image": "https://lh3.googleusercontent.com/a/ACg8ocL6y5B9tgkFiWZDdeALTyJN8RiXhlzX__BTmyZS-GVHatE8sPeb=s96-c",
    "provider": "google",
    "role": "user",
    "lastActive": new Date("2026-03-17T00:42:49.397Z"),
    "createdAt": new Date("2026-03-17T00:13:31.084Z"),
    "updatedAt": new Date("2026-03-17T00:42:49.398Z"),
    "__v": 0
  }
]);

db.receitas.insertMany([
  {
    "_id": ObjectId("69b77aff40dd665de2754489"),
    "userId": ObjectId("69b7653cdb63a6823601fb3c"),
    "descricao": "Mesada",
    "valor": 100,
    "dataRecebimento": new Date("2026-03-05T00:00:00.000Z"),
    "categoria": "Mesada",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T03:37:35.616Z"),
    "updatedAt": new Date("2026-03-16T03:37:35.616Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b77b1640dd665de275448c"),
    "userId": ObjectId("69b7653cdb63a6823601fb3c"),
    "descricao": "Mesada",
    "valor": 100,
    "dataRecebimento": new Date("2026-02-05T00:00:00.000Z"),
    "categoria": "Mesada",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T03:37:58.008Z"),
    "updatedAt": new Date("2026-03-16T03:37:58.008Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b873dd5a1854f9c2d836ae"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Aluguel",
    "valor": 3500,
    "dataRecebimento": new Date("2026-01-20T00:00:00.000Z"),
    "categoria": "Aluguel",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:19:25.228Z"),
    "updatedAt": new Date("2026-03-16T21:19:25.228Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b873e95a1854f9c2d836b1"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Aluguel",
    "valor": 3500,
    "dataRecebimento": new Date("2026-02-20T00:00:00.000Z"),
    "categoria": "Aluguel",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:19:37.844Z"),
    "updatedAt": new Date("2026-03-16T21:19:37.844Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b873fd5a1854f9c2d836b4"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Aluguel",
    "valor": 3500,
    "dataRecebimento": new Date("2026-03-20T00:00:00.000Z"),
    "categoria": "Aluguel",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:19:57.091Z"),
    "updatedAt": new Date("2026-03-16T22:09:08.486Z"),
    "__v": 0
  }
]);

db.despesas.insertMany([
  {
    "_id": ObjectId("69b77b4540dd665de27544b7"),
    "userId": ObjectId("69b7653cdb63a6823601fb3c"),
    "descricao": "Passeio no shopping ",
    "valor": 50,
    "dataVencimento": new Date("2026-03-08T00:00:00.000Z"),
    "categoria": "Shopping ",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T03:38:45.083Z"),
    "updatedAt": new Date("2026-03-16T03:38:45.083Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b77b7040dd665de27544bf"),
    "userId": ObjectId("69b7653cdb63a6823601fb3c"),
    "descricao": "Sorvete no shopping ",
    "valor": 20,
    "dataVencimento": new Date("2026-03-08T00:00:00.000Z"),
    "categoria": "Comida ",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T03:39:28.913Z"),
    "updatedAt": new Date("2026-03-16T03:39:28.913Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b874835a1854f9c2d836b9"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Transporte Escolar",
    "valor": 380,
    "dataVencimento": new Date("2026-03-05T00:00:00.000Z"),
    "categoria": "Transporte Escolar",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:22:11.136Z"),
    "updatedAt": new Date("2026-03-16T21:22:11.136Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b874be5a1854f9c2d836be"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cesan",
    "valor": 215.2,
    "dataVencimento": new Date("2026-03-17T00:00:00.000Z"),
    "categoria": "Agua",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:23:10.213Z"),
    "updatedAt": new Date("2026-03-16T21:23:10.213Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b874df5a1854f9c2d836c1"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cesan",
    "valor": 250,
    "dataVencimento": new Date("2026-03-05T00:00:00.000Z"),
    "categoria": "Agua",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:23:43.297Z"),
    "updatedAt": new Date("2026-03-16T21:23:43.297Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b875075a1854f9c2d836c4"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Sumicity",
    "valor": 119.9,
    "dataVencimento": new Date("2026-03-12T00:00:00.000Z"),
    "categoria": "Internet",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:24:23.629Z"),
    "updatedAt": new Date("2026-03-16T21:24:23.629Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b875635a1854f9c2d836f3"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Material Escolar",
    "valor": 286.16,
    "dataVencimento": new Date("2026-02-10T00:00:00.000Z"),
    "categoria": "Escola",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:25:55.841Z"),
    "updatedAt": new Date("2026-03-16T21:25:55.841Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b875a65a1854f9c2d836f6"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cartão de Credito Sicoob",
    "valor": 300,
    "dataVencimento": new Date("2026-02-11T00:00:00.000Z"),
    "categoria": "Cartão",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:27:02.198Z"),
    "updatedAt": new Date("2026-03-16T21:27:02.198Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b875c55a1854f9c2d836f9"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cartão de Credito Sicoob",
    "valor": 4421.8,
    "dataVencimento": new Date("2026-02-09T00:00:00.000Z"),
    "categoria": "Cartão",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:27:33.023Z"),
    "updatedAt": new Date("2026-03-16T21:27:33.023Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b875f45a1854f9c2d836fc"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Mensalidade Colegio",
    "valor": 966.63,
    "dataVencimento": new Date("2026-02-04T00:00:00.000Z"),
    "categoria": "Escola",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:28:20.015Z"),
    "updatedAt": new Date("2026-03-16T21:28:20.015Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b876a25a1854f9c2d836ff"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cartão de Credito Sicoob",
    "valor": 3132,
    "dataVencimento": new Date("2026-01-08T00:00:00.000Z"),
    "categoria": "Cartão",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:31:14.063Z"),
    "updatedAt": new Date("2026-03-16T21:31:14.063Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b877a75a1854f9c2d83737"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Compra Patinete",
    "valor": 1907.17,
    "dataVencimento": new Date("2026-03-09T00:00:00.000Z"),
    "categoria": "Lazer",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:35:35.294Z"),
    "updatedAt": new Date("2026-03-16T21:35:35.294Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b877e25a1854f9c2d8373a"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cartão de Credito Sicoob",
    "valor": 2054.36,
    "dataVencimento": new Date("2026-03-09T00:00:00.000Z"),
    "categoria": "Cartão",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:36:34.990Z"),
    "updatedAt": new Date("2026-03-16T21:36:34.990Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b878285a1854f9c2d8373d"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Cartão de Credito Inter",
    "valor": 209.88,
    "dataVencimento": new Date("2026-03-09T00:00:00.000Z"),
    "categoria": "Cartão",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:37:44.810Z"),
    "updatedAt": new Date("2026-03-16T21:37:44.810Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b878895a1854f9c2d83740"),
    "userId": ObjectId("69b7562729955a7a81143409"),
    "descricao": "Pedro",
    "valor": 600,
    "dataVencimento": new Date("2026-03-04T00:00:00.000Z"),
    "categoria": "Academia",
    "tipoMovimentacao": "Fixo",
    "createdAt": new Date("2026-03-16T21:39:21.971Z"),
    "updatedAt": new Date("2026-03-16T21:39:21.971Z"),
    "__v": 0
  }
]);

db.messages.insertMany([
  {
    "_id": ObjectId("69b889e75a1854f9c2d837e9"),
    "senderId": ObjectId("69b7562729955a7a81143409"),
    "receiverId": ObjectId("69b76072198bc2846bccbdfe"),
    "text": "oi tudo bem",
    "status": "read",
    "isRead": true,
    "isEdited": true,
    "isDeleted": true,
    "createdAt": new Date("2026-03-16T22:53:27.534Z"),
    "updatedAt": new Date("2026-03-16T22:54:50.395Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b88a045a1854f9c2d837ef"),
    "senderId": ObjectId("69b7562729955a7a81143409"),
    "receiverId": ObjectId("69b76072198bc2846bccbdfe"),
    "text": "oi tudo bem?",
    "status": "read",
    "isRead": true,
    "isEdited": true,
    "isDeleted": false,
    "createdAt": new Date("2026-03-16T22:53:56.817Z"),
    "updatedAt": new Date("2026-03-16T22:54:50.395Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b88b365a1854f9c2d83885"),
    "senderId": ObjectId("69b76072198bc2846bccbdfe"),
    "receiverId": ObjectId("69b7562729955a7a81143409"),
    "text": "Oi tudo bem é como estão as coisas?",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-16T22:59:02.559Z"),
    "updatedAt": new Date("2026-03-16T23:11:38.181Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b88bcc5a1854f9c2d838da"),
    "senderId": ObjectId("69b7653cdb63a6823601fb3c"),
    "receiverId": ObjectId("69b76072198bc2846bccbdfe"),
    "text": "oi mamãe",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-16T23:01:32.091Z"),
    "updatedAt": new Date("2026-03-16T23:14:26.537Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b88bef5a1854f9c2d8391a"),
    "senderId": ObjectId("69b7653cdb63a6823601fb3c"),
    "receiverId": ObjectId("69b7562729955a7a81143409"),
    "text": "oi papai",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-16T23:02:07.461Z"),
    "updatedAt": new Date("2026-03-16T23:11:56.755Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b88cb65a1854f9c2d83967"),
    "senderId": ObjectId("69b76072198bc2846bccbdfe"),
    "receiverId": ObjectId("69b7562729955a7a81143409"),
    "text": "Você está aí?",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-16T23:05:26.342Z"),
    "updatedAt": new Date("2026-03-16T23:11:38.181Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b89dd5d1af3558cc3f775b"),
    "senderId": ObjectId("69b76072198bc2846bccbdfe"),
    "receiverId": ObjectId("69b89cabd1af3558cc3f7703"),
    "text": "Oi",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-17T00:18:29.435Z"),
    "updatedAt": new Date("2026-03-17T00:19:33.177Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b89ddfd1af3558cc3f7786"),
    "senderId": ObjectId("69b76072198bc2846bccbdfe"),
    "receiverId": ObjectId("69b89cabd1af3558cc3f7703"),
    "text": "Tudo bem",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-17T00:18:39.957Z"),
    "updatedAt": new Date("2026-03-17T00:19:33.177Z"),
    "__v": 0
  },
  {
    "_id": ObjectId("69b89e0bd1af3558cc3f77c2"),
    "senderId": ObjectId("69b7562729955a7a81143409"),
    "receiverId": ObjectId("69b89cabd1af3558cc3f7703"),
    "text": "Oi diogo",
    "status": "read",
    "isRead": true,
    "isEdited": false,
    "isDeleted": false,
    "createdAt": new Date("2026-03-17T00:19:23.254Z"),
    "updatedAt": new Date("2026-03-17T00:22:48.635Z"),
    "__v": 0
  }
]);

db.configs.insertMany([
  {
    "_id": ObjectId("69b8a339d1af3558cc3f79fb"),
    "key": "google_login_enabled",
    "value": true,
    "isPublic": true,
    "description": "Habilita o botão de login pelo Google na tela inicial",
    "createdAt": new Date("2026-03-17T00:41:29.033Z"),
    "updatedAt": new Date("2026-03-17T00:42:24.644Z"),
    "__v": 0
  }
]);

