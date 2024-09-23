'use strict';
const _ = require('lodash');
const path = require('path');
const multer = require('multer');

const CommonService = require('./common.service');
const { CommandesService } = require('./commandes.service');
const { CatalogueService } = require('./catalogues.service');

const { PrinterService } = require('./printer.service');

// Configure Multer to use the /tmp directory for uploads in serverless environments
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempDir = '/tmp'; // Use /tmp directory for temporary file storage
    cb(null, tempDir); // Pass the directory to multer
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName); // Set the file name
  },
});

const upload = multer({ storage });
module.exports = (router) => {
    router.get('/health/check', (req, res, next) => {
        res.send(_.pick(require('./package.json'), ['name', 'version']))
    });

    router.post('/catalogues/convert-xls-to-json', upload.single('filePath'), (req, res, next) => {
      const filePath = path.join('/tmp', req.file.filename); // Use the file saved in /tmp      
        CommonService.executeAndSendResult(async () => {
          return await new CatalogueService().convertXlsToJson(filePath, res);
        }, res, next);
    })

    router.get('/catalogues/download-example-xls', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CatalogueService().downloadExampleXls(res);
      }, res, next);
    });

    router.get('/commandes', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CommandesService().getCommandes(req, res);
      }, res, next);
    });

    router.get('/commande/:id', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CommandesService().getCommandeById(req, res);
      }, res, next);
    });

    router.post('/commande', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CommandesService().createCommande(req.body, res);
      }, res, next);
    });

    router.post('/commande/:idCommande/extend', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
      return await new CommandesService().extendCommande(req, res);
      }, res, next);
    });

    router.post('/commande/print-ticket', async (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new PrinterService().printCommande(req.body, res);
      }, res, next);
    });

    router.post('/print', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new PrinterService().test(req.body, res);
      }, res, next);
    });

    return router;
}