import express, { Request, Response } from "express"
import { MembershipService } from "../../services/membership.service"
import { CreateMembershipRequest } from "../../types/membership.types"

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  try {
    const memberships = MembershipService.getAllMemberships();
    res.status(200).json(memberships);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
})

router.post("/", (req: Request, res: Response) => {
  try {
    const membershipRequest: CreateMembershipRequest = req.body;
    
    const validationError = MembershipService.validateMembershipRequest(membershipRequest);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const result = MembershipService.createMembership(membershipRequest);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
})

export default router;
