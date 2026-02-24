import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { generateVariantDimensions } from './services/variantDimension.service.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AdminPanel';

async function fullVariantTest() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };
    try {
        log("Connecting to URI: " + MONGO_URI);
        await mongoose.connect(MONGO_URI);
        const db = mongoose.connection.db;

        // 1. Find ProductGroup
        const product = await db.collection('productgroupmasters').findOne({});
        if (!product) throw new Error("No product group found in 'productgroupmasters'");
        log(`Found ProductGroup: ${product.name} (${product._id})`);

        // 2. Find Color
        const color = await db.collection('colors').findOne({ status: 'active' });
        if (!color) throw new Error("No active color found in 'colors' collection");
        log(`Found Color: ${color.name} (${color._id})`);

        // 3. Find Attribute Value & its Type
        const attrVal = await db.collection('attributevalues').findOne({ status: 'active' });
        if (!attrVal) throw new Error("No active attribute value found");
        log(`Found Attribute Value: ${attrVal.name} (${attrVal._id}) for Type: ${attrVal.attributeType}`);

        const apiBody = {
            productGroupId: product._id.toString(),
            brand: "TestBrand",
            basePrice: 100,
            baseDimensions: {
                color: [color._id.toString()],
                size: []
            },
            attributeDimensions: [
                {
                    attributeId: attrVal.attributeType.toString(),
                    values: [attrVal._id.toString()]
                }
            ]
        };

        log("Testing generation with payload: " + JSON.stringify(apiBody, null, 2));

        const result = await generateVariantDimensions(apiBody);

        log("\n--- TEST RESULT ---");
        log(JSON.stringify(result, null, 2));

        if (result.success && (result.totalGenerated > 0 || result.skipped > 0)) {
            log("\n✅ FULL TEST PASSED: Variant(s) generated or already exist.");
        } else {
            log("\n❌ FULL TEST FAILED: No variants were processed.");
        }

    } catch (err) {
        log("\n💥 FULL TEST CRASHED:");
        log(err.stack || err.toString());
    } finally {
        await mongoose.disconnect();
        fs.writeFileSync('fullTestResults.txt', output);
        log("\nTest log saved to fullTestResults.txt");
    }
}

fullVariantTest();
