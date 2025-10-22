import { v4 as uuidv4 } from 'uuid';

function getDefaultData(){
    const DefaultData = {
        options: {
          lockTableHead: false,
          lockFullTable: false,
          lineWrap: true,
          rowIndex: true,
          uuid: uuidv4(),
        },
        columns: [
          {
            "name": "No.",
            "dataType": "rowIndex",
            "width": 60,
            uuid: uuidv4(),
          },
          {
            name: 'Title',
            dataType: 'treeNode',
            width: 150,
            uuid: uuidv4(),
          },
        ],
        rows: [],
      };

    return DefaultData;
}

export default getDefaultData;