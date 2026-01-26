import winston from 'winston'
import dotenv from 'dotenv'
import fs from 'fs'
import path from 'path'
import 'winston-mongodb';

dotenv.config()
const logPath = process.env.LOGS ?? ''
console.log(logPath)
/*
new winston.transports.File({
    filename: path.join(logPath, 'errors.log'),
    level: 'error'
  }),
  new winston.transports.File({ filename: path.join(logPath, 'debug.log') }),    
*/ 
//if (logPath !== undefined && !fs.existsSync(logPath)) fs.mkdirSync(logPath)
export const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(winston.format.prettyPrint(), winston.format.timestamp()),
  transports: [
  new winston.transports.MongoDB({
      db:  process.env.DATABASE_URL, // URI completa
      collection: 'app_logs',                    // opcional, default: 'log'
      tryReconnect: true,                        // re-intenta si se cae
      expireAfterSeconds: 60 * 60 * 24 * 7,       // TTL: 7 días
      level:'debug'
    }),
    new winston.transports.MongoDB({
      db: process.env.DATABASE_URL, // URI completa
      collection: 'error_logs',                    // opcional, default: 'log'
      tryReconnect: true,                        // re-intenta si se cae
      expireAfterSeconds: 60 * 60 * 24 * 7*4,       // TTL: 7 días
      level:'error'
    })
  
  ]

})

if (process.env.ENVIROMENT !== 'PRODUCTION') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.prettyPrint(),
      winston.format.colorize({ level:true }),
      winston.format.timestamp())
  }))
}