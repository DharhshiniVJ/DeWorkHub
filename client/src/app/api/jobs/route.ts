import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Job from '@/models/Job';
import { getUserFromToken } from '@/lib/auth'

export async function GET() {
    try {
        await connectToDatabase();
        const jobs = await Job.find()
            .populate('companyId', 'name')
            .sort({ createdAt: -1 });
        return NextResponse.json(jobs);
    } catch (error) {
        console.error('Error fetching jobs:', error);
        return NextResponse.json({ message: 'Failed to fetch jobs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        const { title, description, requiredSkills, budget } = await req.json();

        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Company') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const job = new Job({
            companyId: user.id,
            title,
            description,
            requiredSkills,
            budget,
            blockchainJobId: 1,
        });

        await job.save();
        return NextResponse.json({ message: 'Job posted successfully', job });
    } catch (error) {
        console.error('Error posting job:', error);
        return NextResponse.json({ message: 'Error posting job' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await connectToDatabase();
        const { jobId, blockchainJobId } = await req.json();

        const user = await getUserFromToken(req);
        if (!user || user.role !== 'Company') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const job = await Job.findOneAndUpdate(
            { _id: jobId, companyId: user.id },
            { blockchainJobId },
            { new: true }
        );

        if (!job) {
            return NextResponse.json({ message: 'Job not found or unauthorized' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Job updated with blockchain ID successfully', job });
    } catch (error) {
        console.error('Error updating job blockchain ID:', error);
        return NextResponse.json({ message: 'Error updating job' }, { status: 500 });
    }
}