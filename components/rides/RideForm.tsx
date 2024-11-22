/* eslint-disable @typescript-eslint/no-unused-vars */
import {useState} from "react";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "../ui/select";
import {  RideSchema } from "@/lib/schemas";

const RideForm = () =>{

    const form = useForm<z.infer<typeof RideSchema>>({
        resolver: zodResolver(RideSchema),
        defaultValues: {
            departureAddress: "",
            arrivalAddress: "",
            departureTime: "",
            availableSeats: 1,
            isRecurring: false,
            frequency: "monthly",
            price: 0,
            waypoints: [],
            status: "active",
        },
    });
    
    const isRecurring = form.watch("isRecurring");
}