//@ts-nocheck
import {vi,describe,it,expect, afterEach} from "vitest"
import request from "supertest"
import { beforeEach } from "node:test"
import { prismaClient } from "../../auth/auth.service"
import { Prisma } from "@prisma/client"
import app from "../../app.middleware"
import { v4 as uuid } from "uuid"
const updateSpy=vi.spyOn(prismaClient.users,"update")
const userReturn:Required<Prisma.UsersCreateWithoutDepartmentsInput>={createdAt:new Date(), updatedAt:new Date(),hash:"texto",id:"bhbhbh",isAdmin:true,lastname:"adrian",name:"abadin",phone:"888888",username:"aabadin@gmail.com"}
const id=uuid()
console.log(id)
describe("UserRoutes",()=>{
    describe("/setAdmin/:id",async()=>{
        beforeEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any )

        })
        it("Should call update, get a 200 status aand a userResponse if id param is provided ",async()=>{
            const response =await request(app).get(`/users/setadmin/${id}`).expect(200)
            expect(updateSpy).toBeCalled()
            expect(response.status).toBe(200)
        })
        it("Should not call update, get a 404 status  if id param is not provided",async()=>{
            const response =await request(app).get(`/users/setadmin`).expect(404)
            expect(response.status).toBe(404)
        })

    })
    describe("/addDepartments/:id",async ()=>{
        beforeEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any )

        })
        afterEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any )

        })
        it("Should call update and get a 200 status if id param is provided and a query name=stringname[] is provided ",async ()=>{
            const nameArray=["uno","dos"]
            const response = await request(app).get(`/users/addDepartments/${id}?name=${nameArray.join("&name=")}`).expect(200)
            expect(response.status).toEqual(200)
            expect(updateSpy).toBeCalled()
        })
        it("Should not call update and get a 400 status if id param is provided and a query name=stringname[] is not provided ",async ()=>{
            const response = await request(app).get(`/users/addDepartments/${id}}`).expect(400)
            expect(response.status).toEqual(400)
            expect(updateSpy).not.toBeCalled()
        })
        it("Should not call update and get a 404 status if id param is not provided ",async ()=>{
            const response = await request(app).get(`/users/addDepartments/`).expect(404)
            expect(response.status).toEqual(404)
            expect(updateSpy).not.toBeCalled()
        })


    })
    describe("/addDepartment",()=>{
        beforeEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any )

        })
        afterEach(()=>{
            vi.resetAllMocks()
            updateSpy.mockResolvedValue(userReturn as any )

        })
        it("Should call update and get a 200 status if id param is provided and a query name=stringname[] is provided ",async ()=>{
            const nameArray=["uno","dos"]
            const response = await request(app).get(`/users/addDepartment/${id}?name=texto`).expect(200)
            expect(response.status).toEqual(200)
            expect(updateSpy).toBeCalled()
        })
        it("Should not call update and get a 400 status if id param is provided and a query name=stringname[] is not provided ",async ()=>{
            const response = await request(app).get(`/users/addDepartment/${id}}`).expect(400)
            expect(response.status).toEqual(400)
            expect(updateSpy).not.toBeCalled()
        })
        it("Should not call update and get a 404 status if id param is not provided ",async ()=>{
            const response = await request(app).get(`/users/addDepartment/`).expect(404)
            expect(response.status).toEqual(404)
            expect(updateSpy).not.toBeCalled()
        })      
    })
})