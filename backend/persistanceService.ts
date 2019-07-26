import { promisify } from 'util';
import * as fs from 'fs';


export async function saveSnapshot(snapshot: any): Promise<void> {
    const writeFileAsync = promisify(fs.writeFile);
    await writeFileAsync('snapshot.json', JSON.stringify(snapshot, null, 4));
}