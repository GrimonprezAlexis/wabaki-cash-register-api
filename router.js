'use strict';
const _ = require('lodash');
const CommonService = require('./common.service');
const { CommandesService } = require('./commandes.service');

module.exports = (router) => {
    router.get('/health/check', (req, res, next) => {
        res.send(_.pick(require('./package.json'), ['name', 'version']))
    });

    router.get('/commandes', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CommandesService().getCommandes(req, res);
      }, res, next);
    });

    router.get('/commande/:id', (req, res, next) => {
      const projects = CommandesService.executeAndSendResult(async () => {
        return await new CommandesService().getCommandeById(req, res);
      }, res, next);
      res.json(projects);
    });
    
    router.post('/commande', (req, res, next) => {
      CommonService.executeAndSendResult(async () => {
        return await new CommandesService().createCommande(req.body, res);
      }, res, next);
    });

    return router;
}