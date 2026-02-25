import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import fs from 'fs';
dotenv.config();

import { generateVariantDimensions } from './services/variantDimension.service.js';
import SizeMaster from './models/masters/SizeMaster.enterprise.js';
import ColorMaster from './models/masters/ColorMaster.enterprise.js';
import AttributeType from './models/AttributeType.model.js';
import AttributeValue from './models/AttributeValue.model.js';
import ProductGroupMaster from './models/masters/ProductGroupMaster.enterprise.js';
import VariantMaster from './models/masters/VariantMaster.enterprise.js';

async function run() {
    await mongoose.connect(process.env.MONGO_URI);

    const pg = await ProductGroupMaster.findOne();
    const size = await SizeMaster.findOne();
    const color = await ColorMaster.findOne();
    const attrType = await AttributeType.findOne({ createsVariant: true });
    const attrVal = await AttributeValue.findOne({ attributeType: attrType._id });

    const payload = {
        productGroupId: pg._id.toString(),
        brand: 'Test',
        basePrice: 100,
        baseDimensions: {
            color: [{ id: color._id.toString(), label: color.name }],
            size: [{ id: size._id.toString(), label: size.value }]
        },
        attributeDimensions: [
            {
                attributeId: attrType._id.toString(),
                attributeName: attrType.displayName || attrType.name,
                values: [{ id: attrVal._id.toString() }]
            }
        ]
    };

    try {
        // DELETE variants with this test product to force creation
        await VariantMaster.deleteMany({ productGroupId: pg._id });

        const result = await generateVariantDimensions(payload);

        const docs = await VariantMaster.find({ generationBatchId: result.batchId }).lean();

        fs.writeFileSync('db-output.json', JSON.stringify(docs, null, 2));
    } catch (err) {
        console.error(err);
    }

    process.exit(0);
}
run();
